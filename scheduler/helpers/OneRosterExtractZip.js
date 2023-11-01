import fs from 'fs'
import extract from 'extract-zip'
import path from 'path'

const extractZip = async (file, removeRawFile = false) => {
  /* extract file */
  try {
    await fs.promises.mkdir(file?.destination, { recursive: true })
    await extract(file?.path, { dir: path.resolve(`${file?.destination}`) });

    /* if raw file is remove */
    if (removeRawFile) {
      if (fs.existsSync(file?.path)) fs.unlinkSync(file?.path);
    }

    return {
      status : true
    }
  } catch (err) {
    console.log(file?.path)
    console.error("helper/import extractFile =>>>>" + err);
    return {
      status : false,
      error : {
        message : err
      }
    }
  }
}; 

const OneRosterExtractZip = async (zippath,OneRosterDownloadResponse) => {
  
  let erros_zip = []
  let data = {
    tenant_name : OneRosterDownloadResponse.data.tenant_name,
    bulk : {},
    delta : []
  }

  if(OneRosterDownloadResponse.data.bulk){
    const extractPathBulk = `${zippath}/${OneRosterDownloadResponse.data.bulk.file_name}`
    const OneRosterExtractZipResponseBulk = await extractZip({
      path : extractPathBulk,
      destination : extractPathBulk.replace('.zip','')
    })     

    if(!OneRosterExtractZipResponseBulk.status){
      erros_zip.push({
        blob_name : OneRosterDownloadResponse.data.bulk.blob_name,
        file_name : OneRosterDownloadResponse.data.bulk.file_name,
        message : OneRosterExtractZipResponseBulk.error.message,
        details : OneRosterExtractZipResponseBulk.error.message
      })
    } else {
      data.bulk = {
        blob_name : OneRosterDownloadResponse.data.bulk.blob_name,
        file_name : OneRosterDownloadResponse.data.bulk.file_name,
        path : path.resolve(extractPathBulk.replace('.zip',''))
      }
    }
  }
  
  for(const OneRosterDelta of OneRosterDownloadResponse.data.delta){
    if(OneRosterDelta){
      const extractPathDelta = `${zippath}/${OneRosterDelta.file_name}`
      const OneRosterExtractZipResponseDelta = await extractZip({
        path : extractPathDelta,
        destination : extractPathDelta.replace('.zip','')
      })     

      if(!OneRosterExtractZipResponseDelta.status){
        erros_zip.push({
          blob_name : OneRosterDelta.blob_name,
          file_name : OneRosterDelta.file_name,
          message : OneRosterExtractZipResponseDelta.error.message,
          details : OneRosterExtractZipResponseDelta.error.message
        })
      } else {
        data.delta.push({
          blob_name : OneRosterDelta.blob_name,
          file_name : OneRosterDelta.file_name,
          path : path.resolve(extractPathDelta.replace('.zip',''))
        })
      }
    }
  }

  return {
    status : erros_zip.length > 0 ? false : true,
    errors : erros_zip.length > 0 ? erros_zip : false,
    data : data
  }
}

export { OneRosterExtractZip };
