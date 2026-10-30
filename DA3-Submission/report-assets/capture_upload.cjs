const { chromium }=require('C:/Users/varse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises');const path=require('node:path');
(async()=>{
 const root=path.resolve('DA3-Submission'), assets=path.join(root,'report-assets'), ev=path.join(assets,'evidence');
 const fixture=path.join(ev,'DA3_upload_verification.txt');
 await fs.writeFile(fixture,'ATHENA DA III evidence upload\nNon-sensitive test fixture created for the academic workflow check on 30 October 2026.\n');
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1500,height:1000}});
 const result={fixture:'DA3_upload_verification.txt',requestUrlSaved:false,restoreExecuted:false};
 try{
  await page.goto('http://127.0.0.1:5174/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Athena Vault Storage/}).click();
  await page.getByText('Live Amazon S3 Ingestion',{exact:true}).waitFor({timeout:20000});
  const put=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().includes('athena-vault-cad.s3'),{timeout:30000});
  await page.locator('input[type=file]').setInputFiles(fixture);
  const response=await put; result.s3PutStatus=response.status();
  await page.getByRole('row').filter({hasText:'DA3_upload_verification.txt'}).waitFor({timeout:20000});
  await page.getByText(/Click to upload or drag/).scrollIntoViewIfNeeded();
  const file='04-file-upload-success.png'; await page.screenshot({path:path.join(assets,'screenshots',file),fullPage:false});
  const manifestPath=path.join(ev,'screenshots.json');const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  const item={path:'report-assets/screenshots/'+file,title:'Verified file upload',caption:'Actual application after uploading the non-sensitive DA3_upload_verification.txt fixture. The S3 PUT returned '+response.status()+' and the refreshed catalog included the file. Existing objects were not altered.',description:'This controlled upload created a new small test object; it did not restore or overwrite an existing file.',capturedAt:new Date().toISOString(),source:'Fresh headless browser session against the running application'};
  manifest.splice(4,0,item);await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2));
  result.catalogContainsFixture=true; console.log('Verified S3 PUT',response.status(),'and refreshed file catalog.');
 }catch(e){result.error=e.message;console.log('Upload verification:',e.message)}
 finally{await fs.writeFile(path.join(ev,'upload_verification.json'),JSON.stringify(result,null,2));await browser.close()}
})();
