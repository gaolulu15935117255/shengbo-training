$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$jsPath = Join-Path $root "scripts\gen-extra-questions.js"
$outPath = Join-Path $root "data\questions-extra.js"

$text = Get-Content $jsPath -Raw -Encoding UTF8
if ($text -notmatch '(?s)const blocks = (\[.*?\])\r?\n\r?\nconst questions') {
  throw "blocks not found"
}
$js = $Matches[1]
$js = [regex]::Replace($js, '(\s)(sub|cat|start|count|freeFirst|items):', '$1"$2":')
$js = [regex]::Replace($js, ',(\s*[}\]])', '$1')
$blocks = $js | ConvertFrom-Json

$questions = @()
foreach ($block in $blocks) {
  if ($block.items.Count -ne $block.count) {
    throw "$($block.sub): count mismatch"
  }
  for ($idx = 0; $idx -lt $block.items.Count; $idx++) {
    $item = $block.items[$idx]
    $num = $block.start + $idx
    $free = ($block.freeFirst -gt 0) -and ($idx -lt $block.freeFirst)
    $questions += [pscustomobject]@{
      id = "q$num"
      category = $block.cat
      subcategory = $block.sub
      type = $item[0]
      stem = $item[1]
      options = @($item[2])
      answer = @($item[3])
      analysis = $item[4]
      knowledge = $item[5]
      free = [bool]$free
    }
  }
}

if ($questions.Count -ne 230) { throw "Total $($questions.Count), expected 230" }
if ($questions[0].id -ne "q71" -or $questions[-1].id -ne "q300") { throw "ID range wrong" }

$json = ($questions | ConvertTo-Json -Depth 10)
# ConvertTo-Json uses lowercase true/false in PS 5 - ensure JS booleans
$json = $json -replace '\bTrue\b', 'true' -replace '\bFalse\b', 'false'
"module.exports = $json" | Set-Content $outPath -Encoding UTF8

$counts = @{}
foreach ($q in $questions) {
  if (-not $counts.ContainsKey($q.subcategory)) { $counts[$q.subcategory] = 0 }
  $counts[$q.subcategory]++
}
Write-Host "Generated $($questions.Count) questions"
$counts.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Host "$($_.Name): $($_.Value)" }
