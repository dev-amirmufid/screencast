import { logger } from "../logger.js";
import { sequelize, db_master } from "../models/index.js"
import { v4 as uuid } from 'uuid';
import DBTenantQueue from "../job/db_tenant/db_tenant.queue.js";
import config from "../config/config.js";
import mysql from "mysql2/promise";
import ltijs from "ltijs";
import { decode } from 'html-entities';
import { ContainerClient } from "@azure/storage-blob";

export const get = async (req, res, next) => {
  try {
    let where = {}
    let limit = parseInt(req.query?.per_page) || null
    let offset = (parseInt(req.query?.page) - 1) * limit || null
    let keyword = req.query?.keyword || null
    //  let filterLinkage = req.query?.filter_linkage || null
    let order = req.query?.order ? [req.query?.order] : [["name", "asc"]];
    let no_lti = req.query?.no_lti || false

    if (keyword) {
      where = {
        ...where,
        [sequelize.Op.or]: [
          {
            name: { [sequelize.Op.substring]: keyword }
          },
          {
            linkage_type: keyword === 'No Linkage' || keyword ===  '連携なし' ? { [sequelize.Op.substring]: 'local' } : keyword.includes('OpenIDConnect') ? { [sequelize.Op.substring]: 'oidc' } : keyword.includes('LTI1.3') ? { [sequelize.Op.substring]: 'lti' } : { [sequelize.Op.substring]: keyword }
          },
          {
            subdomain: { [sequelize.Op.substring]: keyword }
          },
          {
            subdomain: { [sequelize.Op.substring]: keyword }
          }
        ]
      }
    }

    //  if(filterLinkage){
    //   where = {
    //       ...where,
    //       linkage_type: filterLinkage
    //   }
    //  }

    if (no_lti) {
      where = {
        ...where,
        linkage_type: { [sequelize.Op.ne]: 'lti' }
      }
    }

    const data = await db_master.tenants.findAndCountAll({
      include: {
        model: db_master.lti_settings,
        require: false,
      },
      where, limit, offset, order
    });

    res.status(200).json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
  return next()

}

export const getById = async (req, res, next) => {
  try {
    const id = req.params.id
    const data = await db_master.tenants.findOne({
      where: { id }
    })

    res.status(200).json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
  return next()

}

export const getBySubdomain = async (req, res, next) => {
  try {
    const subdomain = req.params.subdomain
    const data = await db_master.tenants.findOne({
      where: { subdomain },
      attributes: ['id', 'limit', 'user_limit']
    })

    res.status(200).json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
  return next()

}

export const validateBlobUrl = async (blobUrl) => {
  try {
    if (blobUrl.indexOf('blob.core.windows.net') <= -1) {
      return false;
    }

    const blobContainerClient = new ContainerClient(
      `${blobUrl}`
    ); //start connection to blob use sas token

    const blockBlobClient = blobContainerClient.getBlockBlobClient("index.html");
    try {
      await blockBlobClient.uploadFile(`index.html`, {
        onProgress: (ev) => console.log(ev),
      });

      logger.info(`[tenants/validata_blob_url] - ${JSON.stringify(blockBlobClient?.url)}`)
      return true;
    } catch (err) {
      logger.error(`[tenants/validata_blob_url] - ${JSON.stringify({ message: err.message })}`)
      return false;
    }
  } catch (err) {
    logger.error(`[tenants/validata_blob_url] - ${JSON.stringify({ message: err.message })}`)
    return false;
  }
}

export const store = async (req, res, next) => {
  try {
    const body = req.body
    body.subdomain = body.subdomain.trim()
    body.subdomain = body.subdomain.toLowerCase()
    body.name = body.name.trim()

    const checkSubdomain = await db_master.tenants.findOne({
      where: { subdomain: body.subdomain }
    })

    if (checkSubdomain) {
      res.status(401).json({ status: false, message: `subdomain already taken`, error_code: 'alert.text.subdomain_already_use' });
      return next()
    }

    if (body.linkage_type == 'lti') {
      body.use_blob_sync = false;
      body.use_blob_tenant_name = false;
      body.blob_url = null;
      body.blob_key = null;
      body.blob_tenant_name = null;
      body.last_sync = null;
      body.sync_status = null;
    }

    if (body.use_blob_sync) {
      const checkBlobUrl = await validateBlobUrl(decode(body.blob_url) + decode(body.blob_key));
      if (!checkBlobUrl) {
        res.status(401).json({ status: false, message: `blob url is invalid`, error_code: 'alert.text.invalid_blob_url' });
        return next()
      }
    }

    const storeData = {
      id: uuid(),
      name: body.name,
      linkage_type: body.linkage_type,
      limit: body.limit,
      user_limit: body.user_limit,
      use_blob_sync: body.use_blob_sync,
      use_blob_tenant_name: body.use_blob_tenant_name,
      blob_url: decode(body.blob_url),
      blob_key: decode(body.blob_key),
      blob_tenant_name: body.blob_tenant_name,
      google_client_id: body.google_client_id,
      microsoft_client_id: body.microsoft_client_id,
      subdomain: body.subdomain
    }
    const data = await db_master.tenants.create(storeData)

    const storeDataLti = {
      id: uuid(),
      tenant_id: data.id,
      platform_name: body.platform_name,
      platform_url: body.platform_url,
      client_id: body.client_id,
      authentication_endpoint: body.authentication_endpoint,
      accesstoken_endpoint: body.accesstoken_endpoint,
      auth_method_type: body.auth_method_type,
      auth_key: body.auth_key
    }

    if (body.linkage_type == 'lti' &&
      storeDataLti.platform_name &&
      storeDataLti.client_id &&
      storeDataLti.platform_url &&
      storeDataLti.authentication_endpoint &&
      storeDataLti.accesstoken_endpoint &&
      storeDataLti.auth_method_type &&
      storeDataLti.auth_key
    ) {

      await db_master.lti_settings.create(storeDataLti)
      const lti = ltijs.Provider;

      lti.registerPlatform({
        name: body.platform_name,
        url: body.platform_url,
        clientId: body.client_id,
        authenticationEndpoint: body.authentication_endpoint,
        accesstokenEndpoint: body.accesstoken_endpoint,
        authConfig: {
          method: body.auth_method_type,
          key: body.auth_key,
        },
      });
    }

    const job = await DBTenantQueue.start({
      id: uuid(),
      tenant_id: storeData.id,
      db_host: config.env.TENANT_DB_HOST,
      db_port: parseFloat(config.env.TENANT_DB_PORT),
      db_user: config.env.TENANT_DB_USER,
      db_password: config.env.TENANT_DB_PASSWORD,
      db_name: config.env.TENANT_DB_NAME,
      tenant_db_name: `realcast_tenant_${storeData.id}`
    })

    logger.info(`[tenants/store] - ${JSON.stringify(data)}`)
    res.status(201).json({ status: true, data, job });
  } catch (err) {
    logger.error(`[tenants/store] - ${JSON.stringify({ message: err.message })}`)
    res.status(500).json({ status: false, message: err.message });
  }
  return next()

}

export const update = async (req, res, next) => {
  try {
    const id = req.params.id
    const body = req.body
    console.log(body)
    body.subdomain = body.subdomain.trim()
    body.subdomain = body.subdomain.toLowerCase()
    body.name = body.name.trim()

    const check = await checkData(req, id);
    if (!check) {
      res.status(401).json({ status: false, message: "Data not found", error_code: 'alert.text.selected_data_not_found' });
      return next()
    }

    const data = await db_master.tenants.findOne({
      where: { id }
    })

    const checkSubdomain = await db_master.tenants.findOne({
      where: {
        subdomain: body.subdomain,
        id: { [sequelize.Op.ne]: id }
      }
    })

    if (checkSubdomain) {
      res.status(401).json({ status: false, message: `subdomain already taken`, error_code: 'alert.text.subdomain_already_use' });
      return next()
    }

    if (body.linkage_type == 'lti') {
      body.use_blob_sync = false;
      body.use_blob_tenant_name = false;
      body.blob_url = null;
      body.blob_key = null;
      body.blob_tenant_name = null;
      body.last_sync = null;
      body.sync_status = null;
    }

    if (body.use_blob_sync) {
      const checkBlobUrl = await validateBlobUrl(decode(body.blob_url) + decode(body.blob_key));
      if (!checkBlobUrl) {
        res.status(401).json({ status: false, message: `blob url is invalid`, error_code: 'alert.text.invalid_blob_url' });
        return next()
      }
    }

    const storeData = {
      id: id,
      name: body.name,
      linkage_type: body.linkage_type,
      limit: body.limit,
      user_limit: body.user_limit,
      use_blob_sync: body.use_blob_sync,
      use_blob_tenant_name: body.use_blob_tenant_name,
      blob_url: decode(body.blob_url),
      blob_key: decode(body.blob_key),
      blob_tenant_name: body.blob_tenant_name,
      google_client_id: body.google_client_id,
      microsoft_client_id: body.microsoft_client_id,
      subdomain: body.subdomain
    }
    await db_master.tenants.update(storeData, {
      where: { id }
    })
    const storeDataLti = {
      id: body.lti_setting_id || uuid(),
      tenant_id: storeData.id,
      platform_name: body.platform_name,
      platform_url: body.platform_url,
      client_id: body.client_id,
      authentication_endpoint: body.authentication_endpoint,
      accesstoken_endpoint: body.accesstoken_endpoint,
      auth_method_type: body.auth_method_type,
      auth_key: body.auth_key
    }
    if (body.linkage_type == 'lti' &&
      storeDataLti.platform_name &&
      storeDataLti.client_id &&
      storeDataLti.platform_url &&
      storeDataLti.authentication_endpoint &&
      storeDataLti.accesstoken_endpoint &&
      storeDataLti.auth_method_type &&
      storeDataLti.auth_key
    ) {
      await db_master.lti_settings.upsert(storeDataLti)
      const lti = ltijs.Provider;

      lti.registerPlatform({
        name: body.platform_name,
        url: body.platform_url,
        clientId: body.client_id,
        authenticationEndpoint: body.authentication_endpoint,
        accesstokenEndpoint: body.accesstoken_endpoint,
        authConfig: {
          method: body.auth_method_type,
          key: body.auth_key,
        }
      });
    }

    let job = null
    if (data.linkage_type != body.linkage_type) {
      job = await DBTenantQueue.start({
        id: uuid(),
        tenant_id: storeData.id,
        db_host: config.env.TENANT_DB_HOST,
        db_port: parseFloat(config.env.TENANT_DB_PORT),
        db_user: config.env.TENANT_DB_USER,
        db_password: config.env.TENANT_DB_PASSWORD,
        db_name: config.env.TENANT_DB_NAME,
        tenant_db_name: `realcast_tenant_${storeData.id}`
      })
    }



    logger.info(`[tenants/update] - ${JSON.stringify(storeData)}`)
    res.status(201).json({ status: true, data: storeData, job });
  } catch (err) {
    logger.error(`[tenants/update] - ${JSON.stringify({ message: err.message })}`)
    res.status(500).send({ status: false, message: err.message });
  }
  return next()
}

export const destroy = async (req, res, next) => {
  try {
    const id = req.params.id

    const check = await checkData(req, id);
    if (!check) {
      res.status(401).json({ status: false, message: "Data not found", error_code: 'alert.text.selected_data_not_found' });
      return next()
    }

    const users = await db_master.users.destroy({
      where: { tenant_id: id }
    })
    const data = await db_master.tenants.destroy({
      where: { id }
    })
    await db_master.databases.destroy({
      where: { tenant_id: id }
    })
    await db_master.lti_settings.destroy({
      where: { tenant_id: id }
    })

    const db_host = config.env.TENANT_DB_HOST;
    const db_port = parseFloat(config.env.TENANT_DB_PORT);
    const db_user = config.env.TENANT_DB_USER;
    const db_password = config.env.TENANT_DB_PASSWORD;
    const tenant_db_name = `realcast_tenant_${id}`

    const conf = { host: db_host, port: db_port, user: db_user, password: db_password }

    const connection = await mysql.createConnection(conf);
    await connection.query(`DROP DATABASE IF EXISTS \`${tenant_db_name}\`;`);

    logger.info(`[tenants/destroy] - ${JSON.stringify(id)}`)
    res.status(201).json({
      status: true, data: {
        id
      }
    });
  } catch (err) {
    logger.error(`[tenants/destroy] - ${JSON.stringify({ message: err.message })}`)
    res.status(500).send({ status: false, message: err.message });
  }
  return next()

}

export const checkSubdomain = async (req, res, next) => {
  try {
    const subdomain = req.headers["subdomain"] || "";
    const data = await db_master.tenants.findOne({
      where: { subdomain }
    })

    res.status(200).json({ status: true, data, subdomain });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
  return next()

}

export const getJobStatus = async (req, res, next) => {
  try {
    const id = req.params.id
    const job = await DBTenantQueue.get(`${id}`)

    res.status(200).json({ status: true, job });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
  return next()

}

export const migration = async (req, res, next) => {
  const data = await db_master.databases.findAll()
  import('child_process').then((child_process) => {
    data.forEach(item => {
      const command = `ENV=1 DB_GROUP=new_tenant_db NEW_TENANT_DB_HOST=${item.db_host} NEW_TENANT_DB_PORT=${item.db_port} NEW_TENANT_DB_USER=${item.db_user} NEW_TENANT_DB_PASSWORD=${item.db_password} NEW_TENANT_DB_DBNAME=${item.db_name} npm run migration:new_tenant_db:migrate -- --env ${process.env.NODE_ENV}`;
      child_process.exec(command, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`, null);
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`, null);
        }
        if (stdout) {
          console.log(null, {
            status: true
          });
        }
      });
    });
  })

  res.status(200).json({ status: true, data });
  return next()

}

const checkData = async (req, id) => {
  const check = await db_master.tenants.findAndCountAll({
    attributes: ['id'],
    where: { id }
  })

  return check.count > 0 ? true : false;
}
