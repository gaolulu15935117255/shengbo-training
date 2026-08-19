$ErrorActionPreference = "Stop"
$root = Join-Path (Split-Path $PSScriptRoot -Parent) "data"

$extraText = Get-Content (Join-Path $root "questions-extra.js") -Raw -Encoding UTF8
$extraText = $extraText -replace "^module\.exports\s*=\s*", ""
$extra = $extraText | ConvertFrom-Json

$baseText = Get-Content (Join-Path $root "questions.js") -Raw -Encoding UTF8
if ($baseText -notmatch "(?s)const baseQuestions = (\[.*?\])\r?\n\r?\nconst questions") {
  throw "baseQuestions not found"
}
$baseJs = $Matches[1]
$baseJs = [regex]::Replace($baseJs, "(\s)(id|category|subcategory|type|stem|options|answer|analysis|knowledge|free):", '$1"$2":')
$baseJs = [regex]::Replace($baseJs, ",(\s*[}\]])", '$1')
$base = $baseJs | ConvertFrom-Json

$all = @($base) + @($extra)
Write-Host "Total: $($all.Count) (base $($base.Count) + extra $($extra.Count))"

$counts = @{}
foreach ($q in $all) {
  if (-not $counts.ContainsKey($q.subcategory)) { $counts[$q.subcategory] = 0 }
  $counts[$q.subcategory]++
}
Write-Host "`nPer subcategory (merged):"
$counts.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Host "  $($_.Name): $($_.Value)" }

$types = @{}
foreach ($q in $all) {
  if (-not $types.ContainsKey($q.type)) { $types[$q.type] = 0 }
  $types[$q.type]++
}
Write-Host "`nQuestion types:"
$types.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Host "  $($_.Name): $($_.Value)" }
