const { chromium } = require('C:/Users/varse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const root=path.resolve('DA3-Submission'), shots=path.join(root,'report-assets/screenshots'), evidence=path.join(root,'report-assets/evidence');
const manifest=[], checks=[];
async function capture(page,file,title,caption,description='') {
  await page.screenshot({path:path.join(shots,file),fullPage:false});
  manifest.push({path:'report-assets/screenshots/'+file,title,caption,description,capturedAt:new Date().toISOString(),source:'Actual Chromium rendering of the running localhost application'});
  await fs.writeFile(path.join(evidence,'screenshots.json'),JSON.stringify(manifest,null,2));
  console.log('Captured',file);
}
async function closeModal(page) { await page.keyboard.press('Escape').catch(()=>{}); }
(async()=>{
  await fs.mkdir(shots,{recursive:true}); await fs.mkdir(evidence,{recursive:true});
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-first-run','--no-default-browser-check']});
  const context=await browser.newContext({viewport:{width:1500,height:1000},deviceScaleFactor:1});
  const page=await context.newPage();
  try {
    page.on('pageerror',e=>checks.push({type:'pageerror',message:e.message}));
    await page.goto('http://127.0.0.1:5174/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.getByRole('heading',{name:'Platform Overview',exact:true}).waitFor();
    await page.getByRole('button',{name:'Sync Telemetry',exact:true}).waitFor({state:'visible',timeout:20000}).catch(()=>{});
    await page.evaluate(()=>document.fonts.ready);
    await capture(page,'01-overview.png','Overview dashboard','Actual overview dashboard. Initial analytics, SLA values, and recent activity are demonstration fixtures; they are not measured operational results.');
    await page.getByRole('button',{name:/Athena Vault Storage/}).click();
    await page.getByRole('heading',{name:'Athena Vault',exact:true}).waitFor();
    const live=await page.getByText('Live Amazon S3 Ingestion',{exact:true}).count()>0;
    checks.push({type:'vault_mode',live});
    await capture(page,'02-vault.png','Vault dashboard','Actual Vault dashboard and upload controls. Connection state and displayed labels are visible; policy badges alone do not prove WORM compliance.');
    const table=page.locator('table').first();
    if(await table.count()) { await table.scrollIntoViewIfNeeded(); await capture(page,'03-vault-files.png','Vault object catalog','Actual object catalog shown by the application. File names and sizes are runtime data when the connection banner reports live S3.'); }
    await page.getByText(/Click to upload or drag/).scrollIntoViewIfNeeded();
    await capture(page,'04-file-upload.png','File upload interface','Actual file upload interface. The displayed input validation and upload options are controls; this screenshot alone is not a successful-upload measurement.');
    // Inspect existing version history read-only. Never confirm a restore.
    const known=page.getByRole('row').filter({hasText:'athena-test.txt'});
    let vbutton=known.getByRole('button',{name:'Version History & Recovery',exact:true});
    if(!(await vbutton.count()))vbutton=page.getByRole('button',{name:'Version History & Recovery',exact:true}).first();
    if(await vbutton.count()) {
      await vbutton.click();
      await page.getByRole('heading',{name:/Version History/}).waitFor();
      await page.getByText('Fetching S3 version history from AWS API...',{exact:true}).waitFor({state:'hidden',timeout:20000}).catch(()=>{});
      await capture(page,'05-version-history.png','Object version history','Actual version-history dialog opened against the selected object. The displayed revision list is recorded without executing a restore.');
      const restore=page.getByRole('button',{name:'Restore this Version',exact:true}).first();
      if(await restore.count()) {
        await restore.click(); await page.getByRole('button',{name:'Confirm Restore',exact:true}).waitFor();
        await capture(page,'06-file-recovery.png','File recovery confirmation','Actual recovery confirmation for an earlier revision. Confirmation was not submitted; no rollback success is claimed.');
        await page.getByRole('button',{name:'Cancel',exact:true}).click();
      }
    }
    // Reload closes any read-only modal without changing the app source or cloud state.
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:/Athena Intellect Document/}).click();
    await page.getByRole('heading',{name:'Athena Intellect',exact:true}).waitFor();
    await capture(page,'07-intellect.png','Athena Intellect','Actual Intellect interface showing the Tesseract image-OCR workflow and document library. Existing preset extraction values are demonstration data, not an accuracy benchmark.');
    // Attempt the bundled local OCR example, recording the actual result or error.
    const quick=page.getByRole('button',{name:'Quick Test: Run Real OCR on Scanned Image',exact:true});
    if(await quick.count()) {
      await quick.click();
      await quick.waitFor({state:'visible'});
      await page.waitForFunction(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Quick Test: Run Real OCR'))?.disabled===false,{},{timeout:90000}).catch(()=>{});
      await capture(page,'08-intellect-ocr.png','Image OCR execution screen','Actual screen after attempting the bundled Tesseract OCR sample. Any displayed result or error is evidence of this attempt; preset confidence values are not measured evaluation accuracy.');
      checks.push({type:'ocr_attempt',body:(await page.locator('main').innerText()).slice(0,5000)});
    }
    await page.getByRole('button',{name:/Athena Sentinel Cloud/}).click();
    await page.getByRole('heading',{name:'Athena Sentinel',exact:true}).waitFor();
    await capture(page,'09-sentinel-auth.png','Sentinel authentication state','Actual Sentinel screen in a fresh browser session. Sign-in is required; no JWT or private browser session was copied for the report.');
    await page.getByRole('button',{name:/Settings Integrations/}).click();
    await page.getByRole('heading',{name:'Platform Settings & Integrations',exact:true}).waitFor();
    await capture(page,'10-settings.png','Integration settings','Actual settings interface. Demo mode and backend connection controls are visible; separate service verification is required for claims beyond the banner.');
    // Explicit demo mode is isolated to this fresh browser profile.
    const toggle=page.getByRole('button',{name:'Switch to Demo Mode',exact:true});
    if(await toggle.count()) await toggle.click();
    await page.getByRole('button',{name:/Athena Sentinel Cloud/}).click();
    await page.getByRole('button',{name:'Investigate',exact:true}).first().waitFor({timeout:15000});
    await page.getByRole('button',{name:'Investigate',exact:true}).first().click();
    await page.getByRole('button',{name:'Close Drawer',exact:true}).waitFor();
    await capture(page,'11-sentinel-demo-detail.png','Sentinel event details in explicit demo mode','Actual Sentinel detail drawer using an explicitly enabled demonstration fixture. It illustrates triage controls and forensic layout and is not presented as a genuine detected incident.');
    await page.getByRole('button',{name:'Close Drawer',exact:true}).click();
    if(!manifest.some(s=>s.path.endsWith('06-file-recovery.png'))) {
      await page.getByRole('button',{name:/Athena Vault Storage/}).click();
      await page.getByRole('button',{name:'Version History & Recovery',exact:true}).first().click();
      await page.getByRole('button',{name:'Restore this Version',exact:true}).first().waitFor({timeout:15000});
      await page.getByRole('button',{name:'Restore this Version',exact:true}).first().click();
      await page.getByRole('button',{name:'Confirm Restore',exact:true}).waitFor();
      await capture(page,'06-file-recovery-demo.png','Recovery workflow in explicit demo mode','Actual recovery confirmation opened in explicit demo mode. No live S3 rollback was performed.');
      await page.getByRole('button',{name:'Cancel',exact:true}).click();
    }
  } catch(error) { checks.push({type:'capture_error',message:error.message}); console.error('Capture continuation needed:',error.message); await page.screenshot({path:path.join(shots,'capture-checkpoint.png')}).catch(()=>{}); }
  finally { await fs.writeFile(path.join(evidence,'screenshot_checks.json'),JSON.stringify(checks,null,2)); await browser.close(); }
  console.log('Screenshot count:',manifest.length);
})();
