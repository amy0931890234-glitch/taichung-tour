[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=================================================="
Write-Host " 諾達股份有限公司 - ERP 結帳單轉發票明細自動填入程式"
Write-Host "=================================================="

$aiDir = "c:\Users\ASUS\Desktop\AI"
$masterFile = "C:\Users\ASUS\Desktop\115  年發票明細.xlsx"

if (-not (Test-Path $masterFile)) {
    Write-Host "⚠️ 未找到桌面的 [$masterFile] 檔案！" -ForegroundColor Red
    exit
}

# Find latest ERP statement file in AI folder
$erpFiles = Get-ChildItem -Path $aiDir -Filter "*.xlsx" | Where-Object { 
    $_.Name -like "*結帳單*" -or $_.Name -like "*salmi30*" 
} | Sort-Object LastWriteTime -Descending

if ($erpFiles.Count -eq 0) {
    Write-Host "⚠️ 未在 $aiDir 資料夾中找到 ERP 結帳單明細表！" -ForegroundColor Red
    Write-Host "請將 ERP 下載的結帳單 Excel 放置於 $aiDir 資料夾中。" -ForegroundColor Yellow
    exit
}

$erpFile = $erpFiles[0].FullName
$outFile = Join-Path $aiDir "115年發票明細_已更新版.xlsx"

Write-Host "讀取最新 ERP 結帳單：$($erpFiles[0].Name)..." -ForegroundColor Green

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wbErp = $excel.Workbooks.Open($erpFile)
    $shErp = $wbErp.Sheets.Item(1)
    $urErp = $shErp.UsedRange
    $rCountErp = $urErp.Rows.Count
    
    # Intelligently detect month from filename first, e.g., 115.08 or 115.09
    $targetMonth = ""
    if ($erpFiles[0].Name -match '115\.(\d{2})') {
        $targetMonth = $matches[1]
    }
    
    $records = @()
    
    for ($r = 1; $r -le $rCountErp; $r++) {
        $dateStr = $urErp.Cells.Item($r, 1).Text.Trim()
        $custName = $urErp.Cells.Item($r, 3).Text.Trim()
        $invNum = $urErp.Cells.Item($r, 5).Text.Trim()
        $salesVal = $urErp.Cells.Item($r, 6).Value2
        $taxVal = $urErp.Cells.Item($r, 7).Value2
        $totalVal = $urErp.Cells.Item($r, 8).Value2
        
        # Check title area for date range, e.g., 單據日: 2026/08/01
        $cellText = $urErp.Cells.Item($r, 6).Text.Trim()
        if ($cellText -match '單據日:\s*\d{4}/(\d{2})/') {
            if (-not $targetMonth) { $targetMonth = $matches[1] }
        }
        
        if ($dateStr -match '^(\d{4})/(\d{2})/(\d{2})') {
            if (-not $targetMonth) { $targetMonth = $matches[2] }
            $day = $matches[3]
        } elseif ($dateStr -match '^(\d{2})$') {
            $day = $dateStr
        } else {
            $day = ""
        }
        
        # Valid invoice transaction row
        if ($custName -and $custName -ne "簡稱" -and ($invNum -or $salesVal -ne $null)) {
            $s = if ($salesVal -ne $null) { [double]$salesVal } else { 0 }
            $t = if ($taxVal -ne $null) { [double]$taxVal } else { 0 }
            $tot = if ($totalVal -ne $null) { [double]$totalVal } else { $s + $t }
            
            $records += @{
                Day = $day
                Cust = $custName
                Sales = $s
                Tax = $t
                Total = $tot
                Note = $invNum # 備註欄僅填入發票號碼
            }
        }
    }
    $wbErp.Close($false)
    
    if (-not $targetMonth) { $targetMonth = "07" } # Fallback
    
    Write-Host "偵測到目標月份為：[$targetMonth 月份]，共解析到 $($records.Count) 筆發票單據。" -ForegroundColor Cyan

    # Copy master file and format output
    if (Test-Path $outFile) { Remove-Item $outFile -Force }
    Copy-Item $masterFile $outFile -Force
    
    $wbMaster = $excel.Workbooks.Open($outFile)
    
    # Locate exact month worksheet tab (e.g., "08", "8", "08月")
    $shMonth = $null
    $intMonth = [int]$targetMonth
    $paddedMonth = "{0:D2}" -f $intMonth
    
    foreach ($s in $wbMaster.Sheets) {
        if ($s.Name -eq $paddedMonth -or $s.Name -eq "$intMonth" -or $s.Name -eq "${paddedMonth}月" -or $s.Name -eq "${intMonth}月") {
            $shMonth = $s
            break
        }
    }
    
    if (-not $shMonth) {
        Write-Host "⚠️ 主發票明細表中未找到 [$paddedMonth] 月份的工作表頁籤！" -ForegroundColor Red
        $wbMaster.Close($false)
        $excel.Quit()
        exit
    }
    
    Write-Host "成功鎖定工作表頁籤：[$($shMonth.Name)]，開始寫入明細..." -ForegroundColor Green
    
    # Fill starting at Row 5
    $startRow = 5
    for ($i = 0; $i -lt $records.Count; $i++) {
        $rowIdx = $startRow + $i
        $rec = $records[$i]
        
        $shMonth.Cells.Item($rowIdx, 1).Value = "$($rec.Day)"
        $shMonth.Cells.Item($rowIdx, 2).Value = "$($rec.Cust)"
        $shMonth.Cells.Item($rowIdx, 3).Value = "$($rec.Sales)"
        $shMonth.Cells.Item($rowIdx, 4).Value = "$($rec.Tax)"
        $shMonth.Cells.Item($rowIdx, 5).Value = "$($rec.Total)"
        $shMonth.Cells.Item($rowIdx, 6).Value = "" # 票期 空白
        $shMonth.Cells.Item($rowIdx, 7).Value = "" # 收日 空白
        $shMonth.Cells.Item($rowIdx, 8).Value = "$($rec.Note)" # 發票號碼
        
        $shMonth.Range("C$rowIdx:E$rowIdx").NumberFormat = "$#,##0;($#,##0)"
        $shMonth.Range("A$rowIdx:H$rowIdx").Font.Name = "Microsoft JhengHei"
        $shMonth.Range("A$rowIdx:H$rowIdx").Font.Size = 10
    }
    
    $wbMaster.Save()
    $wbMaster.Close($false)
    
    # Overwrite desktop file
    try {
        Copy-Item $outFile $masterFile -Force
        Write-Host "✅ 已成功將 [$targetMonth 月份] 的數據自動填入桌面的 [$masterFile]！" -ForegroundColor Green
    } catch {
        Write-Host "提示：更新完成檔案已儲存至 $outFile" -ForegroundColor Yellow
    }

    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

} catch {
    Write-Host "❌ 處理失敗: $_" -ForegroundColor Red
    if ($excel) { $excel.Quit() }
}
