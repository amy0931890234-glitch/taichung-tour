[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=================================================="
Write-Host " 諾達股份有限公司 - 南區服務處 每月毛利報表自動生成器"
Write-Host "=================================================="

$aiDir = "c:\Users\ASUS\Desktop\AI"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

# Candidate files sorted by LastWriteTime
$candidates = Get-ChildItem -Path $aiDir -Filter "*.xlsx" | Where-Object { 
    $_.Name -notlike "*主管呈報版*" -and 
    $_.Name -notlike "*型態別*" -and 
    $_.Name -notlike "*鼎新 ERP 原始 Excel 報表.xlsx*"
} | Sort-Object LastWriteTime -Descending

$targetFile = $null
$targetWb = $null
$mlSheet = $null

foreach ($f in $candidates) {
    try {
        $wb = $excel.Workbooks.Open($f.FullName)
        foreach ($s in $wb.Sheets) {
            if ($s.Name -like "*毛利表*") {
                $targetFile = $f
                $targetWb = $wb
                $mlSheet = $s
                break
            }
        }
        if ($targetFile) { break }
        $wb.Close($false)
    } catch {
        # continue checking
    }
}

if (-not $targetFile) {
    Write-Host "⚠️ 未能在資料夾中找到含有【毛利表】的 ERP 原始檔案！" -ForegroundColor Red
    Write-Host "請將鼎新 ERP 下載的原始 Excel 檔放進 c:\Users\ASUS\Desktop\AI 資料夾後重新執行。" -ForegroundColor Yellow
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    exit
}

Write-Host "發現並開啟 ERP 原始報表：$($targetFile.Name)" -ForegroundColor Green

try {
    $ur = $mlSheet.UsedRange
    $rowCount = $ur.Rows.Count

    # Aggregate by Category Type
    $catSales = @{}
    $catCost = @{}
    $catProfit = @{}
    $reportDate = "2026/07"
    
    for ($r = 5; $r -le $rowCount; $r++) {
        $dStr = $ur.Cells.Item($r, 1).Text.Trim()
        $sStr = $ur.Cells.Item($r, 4).Text.Trim() -replace ',','' -replace ' ','';
        $cStr = $ur.Cells.Item($r, 5).Text.Trim() -replace ',','' -replace ' ','';
        $pStr = $ur.Cells.Item($r, 6).Text.Trim() -replace ',','' -replace ' ','';
        $tStr = $ur.Cells.Item($r, 8).Text.Trim()
        
        if ($dStr -match '^\d{4}/\d{2}') {
            $reportDate = $dStr.Substring(0, 7)
        }
        
        if ($dStr -match '^\d{4}' -and $tStr) {
            $s = 0; $c = 0; $p = 0
            [double]::TryParse($sStr, [ref]$s) | Out-Null
            [double]::TryParse($cStr, [ref]$c) | Out-Null
            [double]::TryParse($pStr, [ref]$p) | Out-Null
            
            if (-not $catSales.ContainsKey($tStr)) {
                $catSales[$tStr] = 0; $catCost[$tStr] = 0; $catProfit[$tStr] = 0
            }
            $catSales[$tStr] += $s
            $catCost[$tStr] += $c
            $catProfit[$tStr] += $p
        }
    }
    
    $monthTag = $reportDate -replace '/',''
    $outPath = Join-Path $aiDir "諾達股份有限公司_${monthTag}_銷貨毛利分析月報(型態別淨額樞紐版).xlsx"
    
    # Close source wb and copy to output
    $targetWb.Close($false)
    if (Test-Path $outPath) { Remove-Item $outPath -Force }
    Copy-Item $targetFile.FullName $outPath -Force
    
    # Open new output workbook
    $wb = $excel.Workbooks.Open($outPath)
    
    # Check if 00_主管執行摘要與KPI already exists
    $dash = $null
    foreach ($s in $wb.Sheets) {
        if ($s.Name -eq "00_主管執行摘要與KPI") {
            $dash = $s
            break
        }
    }
    if (-not $dash) {
        $dash = $wb.Sheets.Add($wb.Sheets.Item(1))
        $dash.Name = "00_主管執行摘要與KPI"
    } else {
        $dash.Cells.Clear()
    }
    
    $dash.Columns.Item(1).ColumnWidth = 20
    $dash.Columns.Item(2).ColumnWidth = 16
    $dash.Columns.Item(3).ColumnWidth = 16
    $dash.Columns.Item(4).ColumnWidth = 16
    $dash.Columns.Item(5).ColumnWidth = 14
    $dash.Columns.Item(6).ColumnWidth = 14
    $dash.Columns.Item(7).ColumnWidth = 14

    $dash.Range("A1").Value = "諾達股份有限公司 - 南區服務處 ${reportDate} 銷貨毛利分析月報"
    $dash.Range("A1").Font.Name = "Microsoft JhengHei"
    $dash.Range("A1").Font.Bold = $true
    $dash.Range("A1").Font.Size = 16
    $dash.Range("A1").Font.Color = 0x5D361B

    $todayStr = (Get-Date).ToString("yyyy/MM/dd")
    $dash.Range("A2").Value = "統計區間：${reportDate}/01 ~ ${reportDate}/31  |  自動分析產出日期：${todayStr}"
    $dash.Range("A2").Font.Name = "Microsoft JhengHei"
    $dash.Range("A2").Font.Size = 10
    $dash.Range("A2").Font.Color = 0x666666

    # KPI Table
    $dash.Range("A4:G4").Merge()
    $dash.Range("A4").Value = "一、型態別銷貨金額與毛利統計及百分比 (含 UV 分台中 30% 扣除)"
    $dash.Range("A4").Font.Name = "Microsoft JhengHei"
    $dash.Range("A4").Font.Bold = $true
    $dash.Range("A4").Font.Size = 11
    $dash.Range("A4").Font.Color = 0xFFFFFF
    $dash.Range("A4").Interior.Color = 0x5D361B

    $headersCat = @("型態別", "未稅銷貨淨額", "銷貨成本", "毛利金額", "毛利率 (%)", "金額占比 (%)", "毛利占比 (%)")
    for ($i=0; $i -lt $headersCat.Count; $i++) {
        $cell = $dash.Cells.Item(5, $i+1)
        $cell.Value = $headersCat[$i]
        $cell.Font.Name = "Microsoft JhengHei"
        $cell.Font.Bold = $true
        $cell.Font.Color = 0xFFFFFF
        $cell.Interior.Color = 0x804000
        $cell.HorizontalAlignment = -4108
    }

    $totSales = 0; $totCost = 0; $totProfit = 0
    foreach ($k in $catSales.Keys) {
        $totSales += $catSales[$k]
        $totCost += $catCost[$k]
        $totProfit += $catProfit[$k]
    }
    
    $uvSales = if ($catSales.ContainsKey("UV")) { $catSales["UV"] } else { 0 }
    $uvCost = if ($catCost.ContainsKey("UV")) { $catCost["UV"] } else { 0 }
    $uvProfit = if ($catProfit.ContainsKey("UV")) { $catProfit["UV"] } else { 0 }
    
    $uvDeductS = - [Math]::Round($uvSales * 0.3)
    $uvDeductC = - [Math]::Round($uvCost * 0.3)
    $uvDeductP = - [Math]::Round($uvProfit * 0.3)
    
    $netSales = $totSales + $uvDeductS
    $netCost = $totCost + $uvDeductC
    $netProfit = $totProfit + $uvDeductP
    
    $rowIdx = 6
    foreach ($k in ($catSales.Keys | Sort-Object { $catSales[$_] } -Descending)) {
        $s = $catSales[$k]
        $c = $catCost[$k]
        $p = $catProfit[$k]
        $m = if ($s -gt 0) { $p / $s } else { 0 }
        $sShare = if ($netSales -gt 0) { $s / $netSales } else { 0 }
        $pShare = if ($netProfit -gt 0) { $p / $netProfit } else { 0 }
        
        $dash.Cells.Item($rowIdx, 1).Value = $k
        $dash.Cells.Item($rowIdx, 2).Value = "$s"
        $dash.Cells.Item($rowIdx, 3).Value = "$c"
        $dash.Cells.Item($rowIdx, 4).Value = "$p"
        $dash.Cells.Item($rowIdx, 5).Value = "$m"
        $dash.Cells.Item($rowIdx, 6).Value = "$sShare"
        $dash.Cells.Item($rowIdx, 7).Value = "$pShare"
        
        $dash.Range("B$rowIdx:D$rowIdx").NumberFormat = "$#,##0;($#,##0)"
        $dash.Range("E$rowIdx:G$rowIdx").NumberFormat = "0.00%;-0.00%"
        $dash.Range("A$rowIdx:G$rowIdx").Font.Name = "Microsoft JhengHei"
        $rowIdx++
    }
    
    # Subtotal
    $rawMargin = if ($totSales -gt 0) { $totProfit / $totSales } else { 0 }
    $rawSShare = if ($netSales -gt 0) { $totSales / $netSales } else { 0 }
    $rawPShare = if ($netProfit -gt 0) { $totProfit / $netProfit } else { 0 }
    
    $dash.Cells.Item($rowIdx, 1).Value = "原始合計小計"
    $dash.Cells.Item($rowIdx, 2).Value = "$totSales"
    $dash.Cells.Item($rowIdx, 3).Value = "$totCost"
    $dash.Cells.Item($rowIdx, 4).Value = "$totProfit"
    $dash.Cells.Item($rowIdx, 5).Value = "$rawMargin"
    $dash.Cells.Item($rowIdx, 6).Value = "$rawSShare"
    $dash.Cells.Item($rowIdx, 7).Value = "$rawPShare"
    $dash.Range("B$rowIdx:D$rowIdx").NumberFormat = "$#,##0;($#,##0)"
    $dash.Range("E$rowIdx:G$rowIdx").NumberFormat = "0.00%;-0.00%"
    $dash.Range("A$rowIdx:G$rowIdx").Font.Bold = $true
    $dash.Range("A$rowIdx:G$rowIdx").Interior.Color = 0xF5F0EB
    $rowIdx++
    
    # UV 30% Deduction
    $uvDeductSShare = if ($netSales -gt 0) { $uvDeductS / $netSales } else { 0 }
    $uvDeductPShare = if ($netProfit -gt 0) { $uvDeductP / $netProfit } else { 0 }
    
    $dash.Cells.Item($rowIdx, 1).Value = "UV分台中30%"
    $dash.Cells.Item($rowIdx, 2).Value = "$uvDeductS"
    $dash.Cells.Item($rowIdx, 3).Value = "$uvDeductC"
    $dash.Cells.Item($rowIdx, 4).Value = "$uvDeductP"
    $dash.Cells.Item($rowIdx, 5).Value = "-"
    $dash.Cells.Item($rowIdx, 6).Value = "$uvDeductSShare"
    $dash.Cells.Item($rowIdx, 7).Value = "$uvDeductPShare"
    $dash.Range("B$rowIdx:D$rowIdx").NumberFormat = "$#,##0;($#,##0)"
    $dash.Range("F$rowIdx:G$rowIdx").NumberFormat = "0.00%;-0.00%"
    $dash.Range("A$rowIdx:G$rowIdx").Font.Bold = $true
    $dash.Range("A$rowIdx:G$rowIdx").Font.Color = 0x0000C5
    $dash.Range("A$rowIdx:G$rowIdx").Interior.Color = 0xFFF0E6
    $rowIdx++
    
    # Net Total
    $netMargin = if ($netSales -gt 0) { $netProfit / $netSales } else { 0 }
    
    $dash.Cells.Item($rowIdx, 1).Value = "扣除後淨合計"
    $dash.Cells.Item($rowIdx, 2).Value = "$netSales"
    $dash.Cells.Item($rowIdx, 3).Value = "$netCost"
    $dash.Cells.Item($rowIdx, 4).Value = "$netProfit"
    $dash.Cells.Item($rowIdx, 5).Value = "$netMargin"
    $dash.Cells.Item($rowIdx, 6).Value = "1.0"
    $dash.Cells.Item($rowIdx, 7).Value = "1.0"
    $dash.Range("B$rowIdx:D$rowIdx").NumberFormat = "$#,##0;($#,##0)"
    $dash.Range("E$rowIdx:G$rowIdx").NumberFormat = "0.00%;-0.00%"
    $dash.Range("A$rowIdx:G$rowIdx").Font.Bold = $true
    $dash.Range("A$rowIdx:G$rowIdx").Interior.Color = 0xE6F4EA
    
    # Update Pivot Sheet
    $pivSheet = $null
    foreach ($s in $wb.Sheets) {
        if ($s.Name -like "*樞紐分析*") {
            $pivSheet = $s
            break
        }
    }
    if ($pivSheet) {
        $pivSheet.Cells.Clear()
        $pivSheet.Range("A1").Value = "型態別銷貨淨額統計 (樞紐分析)"
        $pivSheet.Range("A1").Font.Name = "Microsoft JhengHei"
        $pivSheet.Range("A1").Font.Bold = $true
        $pivSheet.Range("A1").Font.Size = 14
        
        $pivSheet.Cells.Item(3, 1).Value = "列標籤 (型態別)"
        $pivSheet.Cells.Item(3, 2).Value = "加總 - 銷貨淨額"
        $pivSheet.Cells.Item(3, 3).Value = "銷貨金額占比 (%)"
        $pivSheet.Range("A3:C3").Font.Bold = $true
        $pivSheet.Range("A3:C3").Font.Color = 0xFFFFFF
        $pivSheet.Range("A3:C3").Interior.Color = 0x5D361B
        
        $pr = 4
        foreach ($k in ($catSales.Keys | Sort-Object { $catSales[$_] } -Descending)) {
            $s = $catSales[$k]
            $sShare = if ($netSales -gt 0) { $s / $netSales } else { 0 }
            $pivSheet.Cells.Item($pr, 1).Value = $k
            $pivSheet.Cells.Item($pr, 2).Value = "$s"
            $pivSheet.Cells.Item($pr, 3).Value = "$sShare"
            $pivSheet.Cells.Item($pr, 2).NumberFormat = "$#,##0;($#,##0)"
            $pivSheet.Cells.Item($pr, 3).NumberFormat = "0.00%;-0.00%"
            $pr++
        }
        
        $pivSheet.Cells.Item($pr, 1).Value = "小計 (原始)"
        $pivSheet.Cells.Item($pr, 2).Value = "$totSales"
        $pivSheet.Cells.Item($pr, 3).Value = "$rawSShare"
        $pivSheet.Cells.Item($pr, 2).NumberFormat = "$#,##0;($#,##0)"
        $pivSheet.Cells.Item($pr, 3).NumberFormat = "0.00%;-0.00%"
        $pivSheet.Range("A$pr:C$pr").Font.Bold = $true
        $pivSheet.Range("A$pr:C$pr").Interior.Color = 0xF5F0EB
        $pr++
        
        $pivSheet.Cells.Item($pr, 1).Value = "UV分台中30%"
        $pivSheet.Cells.Item($pr, 2).Value = "$uvDeductS"
        $pivSheet.Cells.Item($pr, 3).Value = "$uvDeductSShare"
        $pivSheet.Cells.Item($pr, 2).NumberFormat = "$#,##0;($#,##0)"
        $pivSheet.Cells.Item($pr, 3).NumberFormat = "0.00%;-0.00%"
        $pivSheet.Range("A$pr:C$pr").Font.Bold = $true
        $pivSheet.Range("A$pr:C$pr").Font.Color = 0x0000C5
        $pivSheet.Range("A$pr:C$pr").Interior.Color = 0xFFF0E6
        $pr++
        
        $pivSheet.Cells.Item($pr, 1).Value = "總計 (扣除後淨銷貨淨額)"
        $pivSheet.Cells.Item($pr, 2).Value = "$netSales"
        $pivSheet.Cells.Item($pr, 3).Value = "1.0"
        $pivSheet.Cells.Item($pr, 2).NumberFormat = "$#,##0;($#,##0)"
        $pivSheet.Cells.Item($pr, 3).NumberFormat = "0.00%;-0.00%"
        $pivSheet.Range("A$pr:C$pr").Font.Bold = $true
        $pivSheet.Range("A$pr:C$pr").Interior.Color = 0xE6F4EA
        
        $pivSheet.UsedRange.Columns.AutoFit() | Out-Null
    }
    
    $wb.Save()
    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
    Write-Host "✅ 報表處理成功！完成檔已儲存至：" -ForegroundColor Green
    Write-Host $outPath -ForegroundColor Yellow
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
    
    # Open generated Excel
    Invoke-Item $outPath

} catch {
    Write-Host "❌ 處理過程中發生錯誤: $_" -ForegroundColor Red
    if ($excel) { $excel.Quit() }
}
