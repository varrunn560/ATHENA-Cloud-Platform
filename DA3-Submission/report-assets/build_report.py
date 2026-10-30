from pathlib import Path
import json, re
from datetime import datetime
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'DA3-Submission'
ASSETS = OUT / 'report-assets'
EVIDENCE = ASSETS / 'evidence'
SHOTS = ASSETS / 'screenshots'
REPORT = OUT / 'Athena_DA3_Final_Report.docx'
REFS = json.loads((EVIDENCE / 'references.json').read_text(encoding='utf-8-sig'))['references']
doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.top_margin = sec.bottom_margin = Cm(2.2)
sec.left_margin = sec.right_margin = Cm(2.3)
sec.header_distance = sec.footer_distance = Cm(1.0)
sec.different_first_page_header_footer = True
for name in ['Normal', 'Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Heading 3', 'Caption', 'Header', 'Footer']:
    style = doc.styles[name]
    style.font.name = 'Times New Roman'
    style.font.color.rgb = RGBColor(0, 0, 0)
    style._element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    style.font.size = Pt(12)
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.line_spacing = 1.12
doc.styles['Normal'].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
doc.styles['Title'].font.size = Pt(22)
doc.styles['Title'].font.bold = True
doc.styles['Heading 1'].font.size = Pt(15)
doc.styles['Heading 2'].font.size = Pt(13)
doc.styles['Heading 3'].font.size = Pt(12)
for name in ['Heading 1', 'Heading 2', 'Heading 3']:
    doc.styles[name].font.bold = True
    doc.styles[name].paragraph_format.space_before = Pt(12)
    doc.styles[name].paragraph_format.keep_with_next = True
doc.styles['Caption'].font.size = Pt(10)
doc.styles['Caption'].font.italic = True
doc.styles['Caption'].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.core_properties.title = 'ATHENA Intelligent Cloud Data Protection and Security Platform'
doc.core_properties.subject = 'VIT BCSE355L Direct Assessment III'
doc.core_properties.author = '[TEAM MEMBER NAMES TO BE FILLED]'
doc.core_properties.keywords = 'Athena, Cloud Architecture Design, DA III, S3, CloudTrail, Sentinel'

def p(text='', bold=False, align=None, style=None):
    para = doc.add_paragraph(style=style)
    para.add_run(text).bold = bold
    if align is not None: para.alignment = align
    return para

def h(text, level=1):
    return doc.add_heading(text, level)

def link(para, text, url):
    rel = para.part.relate_to(url, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
    node = OxmlElement('w:hyperlink'); node.set(qn('r:id'), rel)
    run = OxmlElement('w:r'); props = OxmlElement('w:rPr')
    color = OxmlElement('w:color'); color.set(qn('w:val'), '174A7E'); props.append(color)
    fonts = OxmlElement('w:rFonts'); fonts.set(qn('w:ascii'), 'Times New Roman'); fonts.set(qn('w:hAnsi'), 'Times New Roman'); props.append(fonts)
    run.append(props); txt = OxmlElement('w:t'); txt.text = text; run.append(txt); node.append(run); para._p.append(node)

def field(para, code):
    f=OxmlElement('w:fldSimple'); f.set(qn('w:instr'), code)
    r=OxmlElement('w:r'); txt=OxmlElement('w:t'); txt.text='1'; r.append(txt); f.append(r); para._p.append(f)

def table(headers, rows, widths=None):
    t=doc.add_table(rows=1, cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
    if widths:
        for c,w in zip(t.columns,widths): c.width=Cm(w)
    for c,txt in zip(t.rows[0].cells,headers):
        c.text=txt
        shade=OxmlElement('w:shd'); shade.set(qn('w:fill'),'DCE6F1'); c._tc.get_or_add_tcPr().append(shade)
        for r in c.paragraphs[0].runs: r.bold=True
    repeat=OxmlElement('w:tblHeader'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for n,row in enumerate(rows):
        cells=t.add_row().cells
        for c,txt in zip(cells,row): c.text=str(txt)
        if n%2:
            for c in cells:
                shade=OxmlElement('w:shd'); shade.set(qn('w:fill'),'F5F7FA'); c._tc.get_or_add_tcPr().append(shade)
    borders=OxmlElement('w:tblBorders')
    for edge in ['top','left','bottom','right','insideH','insideV']:
        el=OxmlElement('w:'+edge); el.set(qn('w:val'),'single'); el.set(qn('w:sz'),'4'); el.set(qn('w:color'),'D9D9D9'); borders.append(el)
    t._tbl.tblPr.append(borders)
    for row in t.rows:
        no_split=OxmlElement('w:cantSplit'); row._tr.get_or_add_trPr().append(no_split)
        for i,c in enumerate(row.cells):
            if widths: c.width=Cm(widths[i])
            c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            margins=OxmlElement('w:tcMar')
            for edge in ['top','left','bottom','right']:
                e=OxmlElement('w:'+edge); e.set(qn('w:w'),'90'); e.set(qn('w:type'),'dxa'); margins.append(e)
            c._tc.get_or_add_tcPr().append(margins)
            for para in c.paragraphs:
                para.alignment=WD_ALIGN_PARAGRAPH.LEFT; para.paragraph_format.line_spacing=1.03; para.paragraph_format.space_after=Pt(3)
                for r in para.runs: r.font.size=Pt(10.5)
    p()
    return t

def figure(path, caption, maxheight=7.0):
    if not path.exists(): return False
    from PIL import Image
    with Image.open(path) as im: ratio=im.height/im.width
    width=min(6.40,maxheight/ratio)
    para=doc.add_paragraph(); para.alignment=WD_ALIGN_PARAGRAPH.CENTER; para.paragraph_format.keep_with_next=True
    run=para.add_run(); shape=run.add_picture(str(path),width=Inches(width))
    shape._inline.docPr.set('descr',caption)
    p(caption,style='Caption')
    return True

header=sec.header.paragraphs[0]; header.alignment=WD_ALIGN_PARAGRAPH.RIGHT
header.add_run('ATHENA  |  BCSE355L  |  Direct Assessment III').font.size=Pt(9)
footer=sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
footer.add_run('Page '); field(footer,'PAGE'); footer.add_run(' of '); field(footer,'NUMPAGES')

# Title page follows the required institution and course order.
logo=next((x for x in [ASSETS/'vit-logo.png',ASSETS/'vit-logo.jpg',ASSETS/'vit-logo.jpeg'] if x.exists()),None)
if logo: figure(logo,'VIT',maxheight=0.9)
else: p('[INSERT OFFICIAL VIT LOGO]',bold=True,align=WD_ALIGN_PARAGRAPH.CENTER)
p('School of Computer Science and Engineering',bold=True,align=WD_ALIGN_PARAGRAPH.CENTER)
p('Course Code: BCSE355L',align=WD_ALIGN_PARAGRAPH.CENTER)
p('Course Name: Cloud Architecture Design',align=WD_ALIGN_PARAGRAPH.CENTER)
p('Direct Assessment III',bold=True,align=WD_ALIGN_PARAGRAPH.CENTER)
p('Maximum Marks: 10',align=WD_ALIGN_PARAGRAPH.CENTER)
p()
title=p('ATHENA',align=WD_ALIGN_PARAGRAPH.CENTER,style='Title')
p('Intelligent Cloud Data Protection and Security Platform',bold=True,align=WD_ALIGN_PARAGRAPH.CENTER)
p('Academic project report',align=WD_ALIGN_PARAGRAPH.CENTER)
p()
table(['Team member names','Registration IDs'],[['[ENTER ALL TEAM MEMBER NAMES]','[ENTER MATCHING REGISTRATION IDS]']],[9.0,7.4])
p('Faculty: [ENTER FACULTY NAME]',align=WD_ALIGN_PARAGRAPH.CENTER)
p('Submission date: 30 October 2026',align=WD_ALIGN_PARAGRAPH.CENTER)
p('Implementation evidence reviewed on 30 October 2026',align=WD_ALIGN_PARAGRAPH.CENTER)
doc.add_page_break()
h('Table of contents')
toc=p()
toc.add_run('[[AUTO_TOC]]')
section_titles=['Abstract','Problem Statement','Project Highlights and Novelty','Dataset Link and DOI','Project Demo Link','GitHub Repository Link','Architecture and Implementation','Screenshots','Results','Conclusion','References','Appendix']
p('The following sections describe the submitted implementation, the supporting evidence, and the remaining limitations. The local application is the verified demonstration environment; public-host deployment is not presented as complete.')
doc.add_page_break()

h('1 Abstract')
p('ATHENA is a modular cloud data protection and security prototype that combines file storage and recovery, document processing, and security-event triage in a React interface. Athena Vault integrates an AWS API Gateway endpoint with Amazon S3 through presigned transfers and provides controls for version listing and restoration. Athena Intellect includes genuine in-browser image OCR through Tesseract.js together with demonstration document presets; a separately developed teammate service is not evidenced by the local repository. Athena Sentinel integrates a dedicated JWT-protected API with Amazon Cognito sign-in and persistent event-status actions. The repository separates explicit Sentinel demo mode from failures in live requests. [1], [2], [8]–[10], [18]–[23]')
p('The assessed prototype supports the practical combination of storage recovery and audit-driven triage, while retaining clear limits. Existing AWS-backed Sentinel test records and an acknowledgement persisted across reload in a recorded application session; these records do not establish genuine threat detections. Fourteen targeted client checks pass, and the production build succeeds. Overview metrics, some storage metadata, cloud OCR presets, and compliance labels require separate validation. No throughput, OCR-accuracy benchmark, availability SLA, or production-scale detection rate is claimed.')

h('2 Problem Statement')
h('2.1 Existing problem',2)
p('Cloud projects commonly expose file storage, recovery controls, document processing, and audit events through separate service consoles. This makes it difficult for a small operations team to relate an object revision to an access failure or an investigation workflow. Accidental overwrites require version-aware recovery; failed access requests require context about the caller, source service, time, and affected resource. A unified interface can reduce navigation and make these workflows visible without treating every displayed metric as verified operational telemetry. The cloud service model and least-trust approach provide the conceptual background for this design. [2], [10], [34], [35]')
h('2.2 Proposed solution and scope',2)
p('ATHENA presents three modules in a shared application shell. Vault lists and transfers S3 objects; Intellect extracts text locally from supported images and displays document-analysis presets; Sentinel retrieves authenticated security events and submits acknowledgement, investigation, and resolution actions. The design uses typed API boundaries rather than coupling browser components directly to storage credentials. The assessed scope is an academic prototype with an operational local frontend and selected deployed AWS integrations, not a fully certified enterprise security platform. [1], [7]–[10], [18]–[23]')

h('3 Project Highlights and Novelty')
p('The project contribution is the integration of storage operations and security triage in a modular interface. It does not introduce a new cryptographic algorithm, detection model, or OCR algorithm. The architecture separates raw object transfer from metadata requests, keeps Cognito sign-in independent from AWS Console login, and maps different backend event schemas into consistent UI types. [1], [8], [9], [20], [23]')
table(['Highlight','Implementation evidence','Boundary'],[
 ['Presigned object workflow','Upload URL request followed by raw S3 PUT; download URL generation','A signature authorizes a transfer; it does not prove a WORM retention policy.'],
 ['Version-aware recovery UI','S3 revision listing and a deliberate restore confirmation','Opening the dialog is distinct from executing and verifying a restore.'],
 ['Explicit Sentinel data source','Live failure returns an empty error state; fixtures require demo mode','Existing live records may still be synthetic test events.'],
 ['Browser OCR privacy','Tesseract worker processes supported image inputs locally','Cloud Textract and Comprehend results are not established by these presets.'],
 ['Reusable client checks','Fourteen tests cover routes, tokens, callback concurrency and demo isolation','Controlled-response tests are not service-level AWS load tests.']
],[3.6,6.1,6.7])

h('4 Dataset Link and DOI')
p('No externally published training or evaluation dataset is required by the implemented storage and API workflows. The local demonstration inputs are user-selected files, bundled document/security fixtures, and stored Sentinel test records. The bundled sample_ocr_test.jpg is an OCR example rather than a versioned scientific benchmark. Dataset URL: not applicable for the current prototype. Dataset DOI: not applicable. No dataset DOI is invented.')
p('For reproducibility, the evidence directory records the client test log, build log, implementation findings, and screenshot index. A future OCR study should identify its dataset, license, train/test protocol, ground truth, and accuracy metric before reporting accuracy. CloudTrail audit events and provider findings should likewise be evaluated against labelled events rather than assumed ground truth. [10]–[13], [22], [24]–[27]')

h('5 Project Demo Link')
para=p('Verified local demonstration: '); link(para,'http://localhost:5174/','http://localhost:5174/')
p('Public demonstration URL: [ENTER VERIFIED PUBLIC DEMO URL]. The hostname athena.joelalfred.me was used for deployment preparation and previously served the Hermes management interface. A staged build or a prepared hostname is not evidence of a completed public ATHENA dashboard deployment. Fill this field only after the public application and its authentication flow are verified.')

h('6 GitHub Repository Link')
p('[ENTER ACTUAL GITHUB REPOSITORY URL]')
p('The inspected submission is the existing local CAD_DA3 workspace. A repository URL was not provided and no remote URL is inferred from the application name. The implementation evidence index records local source paths so that a reviewer can trace the report to the submitted code.')

h('7 Architecture and Implementation')
h('7.1 System architecture',2)
p('The browser frontend uses React, TypeScript, Vite, and Tailwind CSS. AppContext coordinates module data, selected objects, notifications, and mode changes. src/services/api.ts implements Vault operations and delegates Sentinel calls to its dedicated service; src/services/sentinelAuth.ts handles application authentication. These layers separate rendering, state, identity, and HTTP transport. [18]–[21], [28]')
figure(OUT/'Athena_Architecture_Diagram.png','Figure 1. Athena architecture and evidence boundaries. Solid paths identify supported integrations; dashed or dotted paths distinguish configured, unverified, and planned capabilities.',maxheight=7.2)
p('The architecture distinguishes the Vault API from the dedicated Sentinel API. A browser requests presigned transfer URLs from Vault and then transfers object bytes to S3. During local development, fixed Vite proxies address the observed browser CORS constraints. Sentinel calls its own /api/sentinel routes with a bearer token. CloudTrail, EventBridge, a processing Lambda, and DynamoDB form the configured ingestion design; deployment configuration evidence and genuine detection evidence are assessed separately. [1], [8]–[10], [14]–[17], [25], [26]')
h('7.2 Athena Vault implementation',2)
p('The configured Vault base URL is https://w5vwnekg26.execute-api.ap-south-1.amazonaws.com. getFiles maps backend object keys and sizes into VaultFile records. requestUploadUrl posts a filename; uploadFileRaw performs a raw PUT to the returned S3 URL; getDownloadUrl requests a time-limited GET URL. The upload control validates supported extensions and enforces a 50 MiB client limit. Signed URL query strings must remain intact across any reverse proxy. API errors are surfaced in the UI, although some Vault read paths can still fall back to local demo fixtures. [1], [24], [28], [31]')
p('getFileVersions retrieves S3 revision metadata, and restoreFileVersion submits an object key and version identifier to the restore endpoint. The modal distinguishes the current revision from earlier revisions and requests confirmation. A version rollback normally creates a new current object version; it should not be confused with RestoreObject, which retrieves archived storage-class objects. The report claims only the recovery behavior evidenced by runtime checks and screenshots. [2], [4]')
p('Several displayed attributes are constructed by the frontend, including storage-class labels, retention days, encryption descriptions, and key identifiers. A badge or checkbox does not prove that Object Lock, Glacier lifecycle policies, KMS key rotation, or retention enforcement is active. These guarantees require bucket configuration, IAM policies, object retention metadata, and explicit policy tests. [3], [5]–[7], [33]')
h('7.3 Athena Intellect implementation',2)
p('The checked-in module contains two distinct paths. Supported image inputs use a Tesseract.js worker to perform actual local OCR. PDF and enterprise presets supply demonstration extraction results, key-value pairs, entities, and confidence values. These fixture values are not measured OCR accuracy and are not evidence of an active Amazon Textract or Amazon Comprehend call. The separate teammate-developed backend was not supplied in this workspace, so its completion is classified as not verified. [22]')
p('Local OCR avoids transmitting the selected image to the project backend in the implemented image workflow. The current browser check successfully processed the bundled image and displayed 16 extracted words, 130 characters, and 91.0 percent engine confidence. Confidence is a model-generated estimate for one sample, not measured accuracy against ground truth. Downloaded WebAssembly, model assets, worker execution, browser memory, and the local file size still influence operation. A rigorous evaluation would define ground-truth text and report character or word error rate. [22]')
h('7.4 Athena Sentinel implementation',2)
p('Sentinel uses https://4so1d2xc4k.execute-api.ap-south-1.amazonaws.com. GET /api/sentinel/events returns an event collection; GET /api/sentinel/events/{eventId} returns details. POST action endpoints end in acknowledge, investigate, or resolve. The client normalizes backend status/severity values and displays caller identity, source IP, region, user agent, and the raw payload. It does not manufacture missing resource identifiers, MITRE mappings, or runbooks. [8]–[10], [14]–[17]')
p('Cognito authorization code flow uses PKCE, random state and nonce values, a registered callback, and sessionStorage for the session. Callback handling and token refresh are deduplicated to avoid concurrent exchanges. The client checks required token fields, issuer, audience and nonce; the API Gateway JWT authorizer is the server-side authorization boundary. Authentication failure must not be disguised as a successful query with demonstration alerts. Client-side decoding alone is not a substitute for signature verification at the API. [8], [9], [23], [30], [35]')
p('The inspected deployed Lambda source supports persistent status actions but does not persist investigation notes or checklist progress. Those controls are disabled for live records. The prior verified UI session loaded two stored test findings, and the designated test record sentinel-test-001 remained acknowledged after reload. Its sample principal, reserved example IP, and test identifier show why a live backend record is not automatically a genuine detected attack. GuardDuty-based findings, S3 Protection coverage, and additional detections remain unverified unless their producer and configuration are separately evidenced. [11]–[13], [27]')
h('7.5 AWS services and their roles',2)
table(['Service','Role in Athena','Evidence boundary'],[
 ['Amazon S3','Object storage and versioned transfer/recovery interfaces','Object listing/transfer evidence is separate from compliance policy claims.'],
 ['API Gateway and Lambda','Vault metadata endpoints and JWT-protected Sentinel actions','Source routes and deployed configuration must match.'],
 ['Amazon Cognito','User-pool sign-in, token issuance and callback management','Application login is separate from AWS Console credentials.'],
 ['CloudTrail and EventBridge','Audit events and pattern-based routing to Sentinel processing','Configured pipeline is not a detection-rate benchmark.'],
 ['DynamoDB','Persistent Sentinel event records and status','Approximate table statistics are not a full event audit.'],
 ['GuardDuty and cloud document AI','Proposed provider findings and cloud OCR enrichment','No claim of active integration without resource/runtime evidence.']
],[3.3,6.0,7.1])
h('7.6 Security and access control',2)
p('The browser should never contain AWS long-lived keys, Cognito client secrets, or deployment private keys. Presigned URLs are temporary bearer capabilities and must be excluded from reports, screenshots, and source control. The application uses a public Cognito client and sends bearer tokens only to its configured Sentinel API. CORS controls browser access patterns but does not replace authorization. Fixed upstream proxies must preserve signatures while avoiding user-selectable proxy targets. [1], [7]–[9], [23], [31], [33], [35]')
p('Encryption at rest, object immutability, and least privilege are distinct controls. S3 default encryption and DynamoDB encryption describe storage protections; Object Lock requires its own retention configuration. Execution roles determine Lambda access to storage and event records. This report does not infer least privilege from an administrator-authenticated development session. Token revocation, stronger session isolation, audit retention, scope enforcement, and genuine-data tests remain important production work. [3], [5]–[7], [14], [15], [29], [32], [35]')
h('7.7 Implementation methodology',2)
p('The implementation assessment followed four steps: inspect typed services and components; run the existing targeted verification script and production build; inspect available application/runtime evidence; and classify unsupported claims separately. The tested client changes address the actual API host, route methods, Cognito callback, error states, and CORS requirements. The report preparation does not rebuild or redesign application functionality.')
table(['Layer','Representative source','Responsibility'],[
 ['Application state','src/context/AppContext.tsx','Module refresh, live/error state, selected records and actions'],
 ['Vault HTTP client','src/services/api.ts','File catalog, transfers, versions and restoration'],
 ['Sentinel HTTP client','src/services/sentinelApi.ts','Dedicated routes, bearer headers and schema mapping'],
 ['Cognito session','src/services/sentinelAuth.ts','PKCE callback, token refresh and sign-out'],
 ['Document processing','src/components/modules/intellect/DocumentUploadZone.tsx','Local OCR and explicitly labelled preset paths'],
 ['Verification','scripts/verify-sentinel.mjs','Controlled-response tests of critical client behavior']
],[3.1,7.0,6.3])

h('8 Screenshots')
p('The following figures are genuine application captures. Their captions state whether the screen shows live integration, a demonstration path, an authentication requirement, or a recovery control that was not executed. A screenshot of a control is not evidence that an associated backend operation completed.')
manifest_path=EVIDENCE/'screenshots.json'
shots=json.loads(manifest_path.read_text(encoding='utf-8-sig')) if manifest_path.exists() else []
if isinstance(shots,dict): shots=shots.get('screenshots',[])
if shots:
    for n,shot in enumerate(shots,2):
        path=Path(shot['path'])
        if not path.is_absolute(): path=OUT/path
        h(shot['title'],2)
        if shot.get('description'): p(shot['description'])
        figure(path,f"Figure {n}. {shot['caption']}",maxheight=5.7)
else:
    previous=ROOT/'sentinel-live-verified.png'
    if previous.exists():
        figure(previous,'Figure 2. Previously captured live Sentinel session with two AWS-backed test records and a persisted acknowledgement. The displayed records do not establish genuine attacks.',maxheight=5.5)
    p('Additional current-session screenshots are listed in the evidence index as they become available. Unavailable screens are not substituted with generated images.')

h('9 Results')
h('9.1 Verification results',2)
p('The existing Sentinel verification script completed with 14 passing checks, and the TypeScript/Vite production build exited successfully. The tests load the real service modules against controlled storage and HTTP responses. They cover event mapping, authentication requirements, the dedicated API path, bearer headers, POST status actions, error propagation, malformed responses, token expiry/refresh, PKCE, state validation, concurrent callbacks, authorization failure, and explicit demo-mode isolation. These outcomes support client correctness within the tested conditions, not throughput, availability, genuine attack detection, or load capacity.')
table(['Check','Observed outcome','Interpretation'],[
 ['Sentinel client verification','14 of 14 checks passed','Controlled-response checks; not live-cloud load tests'],
 ['Production compilation','TypeScript and Vite build passed','Deployable static bundle generated'],
 ['Bundle advisory','Vite emitted a large-chunk warning','A performance improvement opportunity; no measured slowdown claimed'],
 ['Sentinel prior live session','Two stored test records; acknowledgement survived reload','Identity, list/detail access and a test status write were verified'],
 ['Object transfer and version recovery','See runtime evidence and figure captions','Do not infer a successful restore from a confirmation dialog'],
 ['Local image OCR execution','16 words, 130 characters; 91.0 percent engine confidence','One successful bundled sample; no labelled accuracy benchmark']
],[4.2,5.6,6.6])
runtime_path=EVIDENCE/'runtime_verification.md'
if runtime_path.exists():
    h('9.2 Current runtime checks',2)
    # A concise verified summary is separately authored and never imports raw credential-bearing responses.
    runtime_json=EVIDENCE/'runtime_verification.json'
    if runtime_json.exists():
        runtime=json.loads(runtime_json.read_text(encoding='utf-8-sig'))
        summary=runtime.get('report_summary')
        if summary:
            for item in summary if isinstance(summary,list) else [summary]: p(item)
    p('Read-only runtime details and their limitations are retained in report-assets/evidence/runtime_verification.md. The current checks do not alter cloud resources or execute a production incident remediation.')
h('9.3 Module status',2)
table(['Module or capability','Classification','Basis and remaining work'],[
 ['Vault core file workflow','Partially implemented','Live API integration exists; map each executed transfer/version test to evidence. Compliance and some metadata remain unverified.'],
 ['Intellect browser image OCR','Implemented and verified','The bundled image was processed successfully in the current browser check.'],
 ['Intellect PDF/cloud enrichment','Demo/mock and planned','Bundled extraction presets; teammate cloud service not verified in this repository.'],
 ['Sentinel UI and authenticated API','Implemented and verified','Client tests and prior live AWS-backed test-event session; status acknowledgement persisted.'],
 ['Sentinel ingestion coverage','Configured or not verified','CloudTrail/EventBridge/Lambda checks may establish configuration, not genuine threat coverage.'],
 ['Overview analytics and health SLA','Demo/mock','Initial metrics and example activity are fixtures, not independently measured telemetry.'],
 ['WORM, Glacier, KMS rotation claims','Not verified','Labels and frontend defaults do not prove cloud policy enforcement.'],
 ['Public deployment','Not verified','Prepared build and target domain; public cutover acceptance not evidenced.']
],[4.2,4.0,8.2])
h('9.4 Limitations',2)
p('The evidence does not establish production-scale reliability, end-to-end detection accuracy, externally published research results, or compliance certification. Existing event records include synthetic tests. Some frontend labels and overview values are fixtures. Cloud OCR supplied by another teammate is outside the available source. Notes/checklist persistence is not supported by the deployed Sentinel action handler. The current client suite uses controlled responses. Public-host configuration and a local build must be verified together before advertising a working public demo.')

h('10 Conclusion')
p('ATHENA demonstrates a practical modular interface for cloud object operations, local document OCR, and authenticated security-event triage. The strongest verified results are the successful client test suite and build, together with the recorded Sentinel authentication and persistent test-event acknowledgement. Vault exposes concrete transfer, revision, and recovery paths, while Intellect deliberately separates local OCR from presets. These results support the feasibility of the integrated prototype without implying completed cloud AI, proven WORM compliance, or genuine threat coverage.')
p('Future work should validate recovery with designated non-production objects, persist investigation notes, add verified resource and retention metadata, assess OCR against labelled ground truth, and measure audit-event ingestion end to end. Provider security findings can then be integrated and evaluated with a defined threat model. Release acceptance should include HTTPS, authentication, CORS, object transfers, version restoration, and an accurately labelled operational dashboard. [2], [3], [11]–[17], [22], [24]–[27], [35]')

h('11 References')
p(f'IEEE numbered references. {sum(bool(r.get("verified")) for r in REFS)} authoritative entries were verified on 30 October 2026. Documentation describes provider capabilities; it is not evidence that every capability is enabled in ATHENA.')
for ref in REFS:
    para=doc.add_paragraph(); para.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.LEFT
    para.paragraph_format.left_indent=Cm(0.65); para.paragraph_format.first_line_indent=Cm(-0.65)
    author=ref.get('authors',ref['publisher'])
    year=f", {ref['year']}" if ref.get('year') else ''
    para.add_run(f"[{ref['id']}] {author}, “{ref['title']}”{year}. [Online]. Available: ")
    link(para,ref['url'],ref['url'])
    para.add_run('. Accessed: Oct. 30, 2026.')

h('12 Appendix')
h('12.1 Research paper link',2)
p('[ENTER RESEARCH PAPER URL IF AVAILABLE]. No project research paper or DOI was provided. This appendix does not imply that the project has been peer reviewed or published.')
h('12.2 Evidence and reproduction',2)
p('The submission folder contains the architecture diagram, screenshots, module-status notes, references, and an evidence index. Reproduce the controlled client checks with npm run test:sentinel and the compilation with npm run build in the original workspace. Start the existing development server with npm run dev and open http://localhost:5174/. Cloud access and a separate Cognito application login are necessary for authenticated Sentinel screens. Do not include tokens, signed transfer URLs, private keys, or account passwords in an academic submission.')
h('12.3 Information to complete before submission',2)
table(['Required item','Action'],[
 ['Student names and registration IDs','Replace the visible cover-page placeholders with the actual team details.'],
 ['Faculty name','Fill the faculty placeholder if required by the course.'],
 ['Official VIT logo','Insert an authentic official image; no substitute logo was generated.'],
 ['GitHub URL','Enter the actual repository URL.'],
 ['Public demo URL','Enter a URL only after the public dashboard is verified.'],
 ['Research paper URL','Supply it if available; otherwise retain not available.']
],[5.1,11.3])

settings=doc.settings.element
update=OxmlElement('w:updateFields'); update.set(qn('w:val'),'true'); settings.append(update)
doc.save(REPORT)
print(f'Created {REPORT}')
print(f'Paragraphs {len(doc.paragraphs)}; tables {len(doc.tables)}; references {len(REFS)}; screenshots {len(shots)}')
