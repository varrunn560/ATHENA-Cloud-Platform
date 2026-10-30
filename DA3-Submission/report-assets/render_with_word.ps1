param([string]$ReportPath,[string]$PdfPath)
$ErrorActionPreference='Stop'
$reportFull=[IO.Path]::GetFullPath($ReportPath)
$pdfFull=[IO.Path]::GetFullPath($PdfPath)
$word=New-Object -ComObject Word.Application
$document=$null
try {
  $word.Visible=$false
  $word.DisplayAlerts=0
  $word.AutomationSecurity=3
  $document=$word.Documents.Open($reportFull,$false,$false,$false)
  $find=$document.Content
  $find.Find.Text='[[AUTO_TOC]]'
  if ($find.Find.Execute()) {
    $find.Text=''
    $toc=$document.TablesOfContents.Add($find,$true,1,2)
    $toc.Update()
  }
  foreach ($name in @('TOC 1','TOC 2')) {
    try { $document.Styles.Item($name).Font.Name='Times New Roman'; $document.Styles.Item($name).Font.Size=12; $document.Styles.Item($name).Font.Color=0 } catch {}
  }
  $document.Repaginate()
  foreach ($toc in $document.TablesOfContents) { $toc.Update() }
  $document.Fields.Update() | Out-Null
  $document.Repaginate()
  $document.Save()
  $document.ExportAsFixedFormat($pdfFull,17)
  Write-Output "Word pages: $($document.ComputeStatistics(2))"
  Write-Output "Tables of contents: $($document.TablesOfContents.Count)"
  Write-Output "Inline figures: $($document.InlineShapes.Count)"
  Write-Output 'DOCX saved and PDF rendered with Microsoft Word.'
} finally {
  if ($null -ne $document) { $document.Close($false) }
  $word.Quit()
}
