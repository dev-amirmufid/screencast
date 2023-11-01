import { ContainerClient } from "@azure/storage-blob";
import fs from "fs";
import moment from "moment";
import config from "../config/config.js";

const _getLastBlob = async (
  TENANT_NAME,
  BLOBContainerClient,
  TENANT_LAST_SYNCRONE
) => {
  const currentDate = `${moment().format("YYYYMMDDHHmm")}00`;
  let tenantLastSync;
  if (TENANT_LAST_SYNCRONE) {
    tenantLastSync = moment(TENANT_LAST_SYNCRONE).format("YYYYMMDDHHmmss");
  }

  let lastDate = null;
  let bulkZip = [];
  let deltaZip = [];
  let lastBulk = null;
  let lastDelta = [];


  for await (const item of BLOBContainerClient.listBlobsByHierarchy("/", {
    prefix: `${TENANT_NAME}/`,
  })) {
    if (item.kind === "blob") {
      const zipType = `${item.name
        .replace(`${TENANT_NAME}/`, "")
        .replace(".zip", "")
        .replace("-", "")
        .replace(/[0-9]/g, "")}`;
      const fileDate = `${item.name
        .replace(`${TENANT_NAME}/`, "")
        .replace(".zip", "")
        .replace("-", "")
        .replace(zipType, "")}`;

      if (
        zipType == "bulk" &&
        (!TENANT_LAST_SYNCRONE || !config.IS_PROCESS_DELTA)
      )
        bulkZip.push(item.name);
      if (
        zipType == "delta" &&
        config.IS_PROCESS_DELTA &&
        (!TENANT_LAST_SYNCRONE || fileDate >= tenantLastSync)
      )
        deltaZip.push(item.name);
    }
  }

  if (bulkZip.length > 0) {
    bulkZip.sort();
    const blob_name = bulkZip.pop();
    lastDate = `${blob_name
      .replace(`${TENANT_NAME}/`, "")
      .replace(".zip", "")
      .replace("-", "")
      .replace(/[A-Za-z]/g, "")}`;

    lastBulk = {
      blob_name: blob_name,
      file_name: blob_name.replace(`${TENANT_NAME}/`, ""),
    };
  } else if (config.IS_PROCESS_DELTA && tenantLastSync) {
    lastDate = tenantLastSync;
  }

  if (deltaZip.length > 0) {
    deltaZip.sort();
    for (const item of deltaZip) {
      const zipDate = `${item
        .replace(`${TENANT_NAME}/`, "")
        .replace(".zip", "")
        .replace("-", "")
        .replace(/[A-Za-z]/g, "")}`;
      if (
        (lastDate && zipDate >= lastDate) ||
        (!lastDate && !TENANT_LAST_SYNCRONE && zipDate <= currentDate)
      ) {
        lastDelta.push({
          blob_name: item,
          file_name: item.replace(`${TENANT_NAME}/`, ""),
        });
      }
    }
  }

  return {
    tenant_name: TENANT_NAME,
    bulk: lastBulk,
    delta: lastDelta,
  };
};

const _downloadBlob = async (
  BLOBContainerClient,
  BLOBName,
  pathName,
  fileName
) => {
  await fs.promises.mkdir(pathName, { recursive: true });

  const blobClient = BLOBContainerClient.getBlobClient(BLOBName);
  try {
    const downloadBlockBlobResponse = await blobClient.downloadToFile(
      `${pathName}/${fileName}`
    );
    // console.log("Downloaded blob content:", downloadBlockBlobResponse);
    return {
      status: true,
      data: downloadBlockBlobResponse,
    };
  } catch (err) {
    return {
      status: false,
      message: err?.details?.message,
      details: err?.details?.message,
    };
  }
};

const OneRosterDownload = async (
  TENANT_ID,
  TENANT_NAME,
  BLOB_URL,
  TENANT_LAST_SYNCRONE
) => {
  const BLOBContainerClient = new ContainerClient(`${BLOB_URL}`);

  const lastBlob = await _getLastBlob(
    TENANT_NAME,
    BLOBContainerClient,
    TENANT_LAST_SYNCRONE
  );

  const pathName = `./download/${TENANT_ID}/${lastBlob.tenant_name}`;
  let errors = [];

  if (lastBlob.bulk) {
    const resDownload = await _downloadBlob(
      BLOBContainerClient,
      lastBlob.bulk.blob_name,
      pathName,
      lastBlob.bulk.file_name
    );
    if (!resDownload.status) {
      errors.push({
        blob_name: lastBlob.bulk.blob_name,
        file_name: lastBlob.bulk.file_name,
        message: resDownload.message,
        details: resDownload.details,
      });
    }
  }

  if (lastBlob.delta.length > 0) {
    for (const deltaBlob of lastBlob.delta) {
      const resDownload = await _downloadBlob(
        BLOBContainerClient,
        deltaBlob.blob_name,
        pathName,
        deltaBlob.file_name
      );
      if (!resDownload.status) {
        errors.push({
          blob_name: deltaBlob.blob_name,
          file_name: deltaBlob.file_name,
          message: resDownload.message,
          details: resDownload.details,
        });
      }
    }
  }

  return {
    status: errors.length > 0 ? false : true,
    errors: errors.length > 0 ? errors : false,
    data: lastBlob,
  };
};

export { OneRosterDownload };
