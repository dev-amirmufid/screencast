import { logger } from "../logger.js";
import { db_master, sequelize } from "../models/index.js"
import { v4 as uuid } from 'uuid';
import md5 from "md5";
import { redisClient } from "../helpers/redis.js";
import moment from 'moment'

export const get = async (req, res, next) => {
  try {
    let where = {}
    let limit = parseInt(req.query?.per_page) || null
    let offset = (parseInt(req.query?.page) - 1) * limit || null
    let keyword = req.query?.keyword || null
    //  let status_room = req.query?.status_room || null
    let order = req.query?.order ? [req.query?.order] : [["name", "asc"]];
    let tenant_id = req.query?.tenant_id || null
    let school_id = req.query?.school_id || null

    if (req.user_data?.role == 'teacher') {
      where = {
        ...where,
        teacher_id: { [sequelize.Op.eq]: req.user_data?.id }
      }
    }

    if (tenant_id) {
      where = {
        ...where,
        tenant_id: { [sequelize.Op.eq]: tenant_id }
      }
    }

    if (school_id) {
      where = {
        ...where,
        school_id: { [sequelize.Op.eq]: school_id }
      }
    }

    //  if(status_room){
    //   where = {
    //       ...where,
    //       is_disabled : { [sequelize.Op.eq] : status_room }
    //   }
    //  }

    if (keyword) {
      where = {
        ...where,
        [sequelize.Op.or]: [
          {
            name: { [sequelize.Op.substring]: keyword }
          },
          {
            expiredAt: (keyword === 'Active' || keyword === '有効') ? { [sequelize.Op.gt]: '2023-06-27' } : keyword === 'Inactive' || keyword === '無効' ? { [sequelize.Op.lt]: '2023-06-27' } : { [sequelize.Op.substring]: keyword }
          },
          {
            expiredAt: (keyword === 'Active' || keyword === '有効') && { [sequelize.Op.eq]: null }
          },
          {
            '$teacher.first_name$': { [sequelize.Op.substring]: keyword }
          }
        ]
      }
    }
    const data = await req.db_tenant.rooms.findAndCountAll({
      include: {
        model: req.db_tenant.teachers
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
    const data = await req.db_tenant.rooms.findOne({
      where: { uri: id }, logging: console.log
    })

    res.status(200).json({ status: true, data, logger: console.log });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
  return next()

}

export const getByRoomId = async (req, res, next) => {
  try {
    const id = req.params.id

    let data
    data = await req.db_tenant.rooms.findOne({
      where: { id: id }
    })

    if (!data) {
      const redisRoom = await redisClient.get(`${req.query.tenant_id}:ROOM:${id}`);
      if (redisRoom) {
        const room = JSON.parse(redisRoom);
        data = {
          id: room.room_id,
          expiredAt: null,
          tenant_id: room.tenant_id,
          uri: room.room_id,
          name: room.room_name,
          temporary: true
        }
      }
    }

    if (data && data.tenant_id) {
      const tenants = await db_master.tenants.findOne({
        where: { id: data.tenant_id }
      })

      var result = {
        rooms: data,
        tenants: tenants
      }

      res.status(200).json({ status: true, data: result });
    } else {
      res.status(404).json({ status: false, data: null, message: 'room not found', error_code: "alert.text.room_not_found" });
    }
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
  return next()

}

export const getByRoomUri = async (req, res, next) => {
  try {
    const id = req.params.id
    let data
    data = await req.db_tenant.rooms.findOne({
      where: { uri: id }
    })

    if (!data) {
      const redisRoom = await redisClient.get(`${req.query.tenant_id}:ROOM:${id}`);
      if (redisRoom) {
        const room = JSON.parse(redisRoom);
        data = {
          id: room.room_id,
          expiredAt: null,
          tenant_id: room.tenant_id,
          uri: room.room_id,
          name: room.room_name,
          temporary: true
        }
      }
    }

    if (data && data.tenant_id) {
      const tenants = await db_master.tenants.findOne({
        where: { id: data.tenant_id }
      })

      var result = {
        rooms: data,
        tenants: tenants
      }

      res.status(200).json({ status: true, data: result });
    } else {
      res.status(404).json({ status: false, data: null, message: 'room not found', error_code: "alert.text.room_not_found" });
    }
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
  return next()

}

export const store = async (req, res, next) => {
  try {
    const body = req.body
    body.name = body?.name?.trim()

    if (!body?.uri) {
      var time = new Date().getTime()
      body.uri = md5(`${req.user_data?.id}-${body.name}-${time}`);
    }
    let tenant_id
    let school_id
    let username
    let teacher_id = body?.teacher_id

    if (req.user_data?.role == 'teacher') {
      tenant_id = req.user_data?.tenant_id
      school_id = req.user_data?.school_id
      teacher_id = req.user_data?.id
      username = req.user_data?.username
    } else {
      const teacherData = await req.db_tenant.teachers.findOne({
        where: {
          id: teacher_id
        }
      })
      tenant_id = teacherData.tenant_id
      school_id = teacherData.school_id
      username = teacherData.username
    }

    const check = await req.db_tenant.rooms.findOne({
      where: {
        school_id: school_id,
        teacher_id: teacher_id,
        name: body.name
      }
    })

    if (check && check.id) {
      res.status(401).json({ status: false, message: "Room name already use", error_code: 'alert.text.roomname_used' });
      return next()
    }
    const storeData = {
      id: uuid(),
      teacher_id: teacher_id,
      tenant_id: tenant_id,
      school_id: school_id,
      name: body.name,
      uri: body?.uri || null,
      is_disabled: body.is_disabled,
      expiredAt: body.expiredAt
    }
    const data = await req.db_tenant.rooms.create(storeData)


    const roomData = {
      tenant_id: tenant_id,
      school_id: school_id,
      teacher_id: teacher_id,
      username: username,
      user_type: 'teacher',
      room_id: storeData.id,
      room_name: storeData.name,
      room_uri: storeData.uri
    };

    const response = {
      status: true,
      data: roomData,
    };

    logger.info(`[rooms/store] - ${JSON.stringify(data)}`)
    const rooms = storeData
    const room_id = rooms.id
    const tenant_data = await db_master.tenants.findOne({
      where: { id: tenant_id }
    })

    await redisClient.SADD(`${tenant_id}:ROOMDATA`, room_id);
    await redisClient.get(`${tenant_id}:ROOM:${room_id}`);
    await redisClient.SET(`${tenant_id}:ROOM:${room_id}`, JSON.stringify({
      tenant_id: rooms.tenant_id,
      quota: (tenant_data.limit) ? tenant_data.user_limit : 'unlimited',
      teacher_id: rooms.teacher_id,
      teacher_name: rooms.teacher_id,
      room_id: rooms.id,
      room_name: rooms.name,
      participant_list: Array(),
      assistant_list: Array(),
      participant_list_ws: Array(),
      assistant_list_ws: Array(),
      participant_list_history: Array(),
      ws: '',
    }));

    res.status(201).json(response);
  } catch (err) {
    let err_message = err.message
    if (err.message == 'Validation error') {
      err_message = err?.errors[0].message
    }
    logger.error(`[rooms/store] - ${JSON.stringify({ message: err_message })}`)
    res.status(500).json({ status: false, message: err_message });
  }
  return next()

}

export const update = async (req, res, next) => {
  try {
    const id = req.params.id
    const body = req.body
    body.name = body?.name?.trim()

    const check = await checkData(req, id);
    if (!check) {
      res.status(401).json({ status: false, message: "room does'nt exists", error_code: 'alert.text.room_not_exists' });
      return next()
    }

    let tenant_id
    let school_id
    let username
    let teacher_id = body.teacher_id

    if (req.user_data?.role == 'teacher') {
      tenant_id = req.user_data?.tenant_id
      school_id = req.user_data?.school_id
      teacher_id = req.user_data?.id
      username = req.user_data?.username
    } else {
      const teacherData = await req.db_tenant.teachers.findOne({
        where: {
          id: teacher_id
        }
      })
      tenant_id = teacherData.tenant_id
      school_id = teacherData.school_id
      username = teacherData.username
    }

    const checkName = await req.db_tenant.rooms.findOne({
      where: {
        school_id: school_id,
        teacher_id: teacher_id,
        name: body.name
      }
    })

    if (checkName && checkName.id !== id) {
      res.status(401).json({ status: false, message: "Room name already use", error_code: 'alert.text.roomname_used' });
      return next()
    }

    const storeData = {
      teacher_id: teacher_id,
      tenant_id: tenant_id,
      school_id: school_id,
      name: body.name,
      is_disabled: body.is_disabled,
      expiredAt: body.expiredAt
    }

    const redisRoomData = await redisClient.GET(`${tenant_id}:ROOM:${id}`)
    if (redisRoomData) {
      const roomData = JSON.parse(redisRoomData);
      roomData.tenant_id = storeData.tenant_id
      roomData.teacher_id = storeData.teacher_id
      roomData.teacher_name = username
      roomData.room_name = storeData.name
      await redisClient.SET(`${tenant_id}:ROOM:${id}`, JSON.stringify(roomData))
    }

    await req.db_tenant.rooms.update(storeData, {
      where: { id }
    })
    logger.info(`[rooms/update] - ${JSON.stringify(storeData)}`)
    res.status(201).json({ status: true, data: storeData });
  } catch (err) {
    logger.error(`[rooms/update] - ${JSON.stringify({ message: err.message })}`)
    res.status(500).send({ status: false, message: err.message });
  }
  return next()

}

export const destroy = async (req, res, next) => {
  try {
    const id = req.params.id
    const check = await checkData(req, id);
    if (!check) {
      res.status(401).json({ status: false, message: "room does'nt exists", error_code: 'alert.text.room_not_exists' });
    }

    const data = await req.db_tenant.rooms.destroy({
      where: { id }
    })
    logger.info(`[rooms/destroy] - ${JSON.stringify({ id })}`)
    res.status(201).json({ status: true, data });
  } catch (err) {
    logger.error(`[rooms/destroy] - ${JSON.stringify({ message: err.message })}`)
    res.status(500).send({ status: false, message: err.message });
  }
  return next()

}

const checkData = async (req, id) => {
  const check = await req.db_tenant.rooms.findAndCountAll({
    attributes: ['id'],
    where: { id }
  })

  return check.count > 0 ? true : false;
}
