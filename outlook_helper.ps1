param (
    [string]$Action = "test",
    [string]$To = "",
    [string]$Subject = "",
    [string]$Body = "",
    [int]$Count = 5
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

try {
    $outlook = New-Object -ComObject Outlook.Application
    $namespace = $outlook.GetNamespace("MAPI")
    $inbox = $namespace.GetDefaultFolder(6) # 6 = olFolderInbox
} catch {
    Write-Host "Error connecting to Outlook: $_" -ForegroundColor Red
    exit 1
}

switch ($Action.ToLower()) {
    "test" {
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host " Outlook Connection Test Successful!" -ForegroundColor Green
        Write-Host " Inbox Folder: $($inbox.Name)" -ForegroundColor Yellow
        Write-Host " Unread Mail Count: $($inbox.UnreadItemCount)" -ForegroundColor Yellow
        Write-Host " Total Items: $($inbox.Items.Count)" -ForegroundColor Yellow
        Write-Host "==========================================" -ForegroundColor Cyan
        
        Write-Host "`nStores in Outlook:" -ForegroundColor Cyan
        foreach ($store in $namespace.Stores) {
            Write-Host " - Store: $($store.DisplayName) (IsCached: $($store.IsCachedMode))"
        }
    }

    "inspect" {
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "Outlook Accounts:" -ForegroundColor Magenta
        foreach ($acc in $namespace.Accounts) {
            Write-Host " Account: $($acc.DisplayName) ($($acc.SmtpAddress)) - Type: $($acc.AccountType)" -ForegroundColor Yellow
        }
        
        Write-Host "`n==========================================" -ForegroundColor Cyan
        Write-Host "Outlook Stores ($($namespace.Stores.Count)):" -ForegroundColor Magenta
        foreach ($store in $namespace.Stores) {
            Write-Host "`nStore: '$($store.DisplayName)' | FilePath: '$($store.FilePath)'" -ForegroundColor Yellow
            try {
                $root = $store.GetRootFolder()
                function PrintFolders($folder, $depth) {
                    $indent = "  " * $depth
                    $latestInfo = ""
                    if ($folder.Items.Count -gt 0) {
                        try {
                            $items = $folder.Items
                            $items.Sort("[ReceivedTime]", $true)
                            $top = $items.GetFirst()
                            if ($top) {
                                $latestInfo = " | Latest: $($top.ReceivedTime) [$($top.Subject)]"
                            }
                        } catch {}
                    }
                    Write-Host "$indent- Folder: $($folder.Name) (Count: $($folder.Items.Count))$latestInfo"
                    foreach ($sub in $folder.Folders) {
                        PrintFolders $sub ($depth + 1)
                    }
                }
                PrintFolders $root 1
            } catch {
                Write-Host "  Error: $_" -ForegroundColor Red
            }
        }
    }

    "unread" {
        Write-Host "Fetching top $Count unread emails..." -ForegroundColor Cyan
        $items = $inbox.Items
        $items.Sort("[ReceivedTime]", $true)
        
        $item = $items.GetFirst()
        $i = 1
        while ($item -ne $null -and $i -le $Count) {
            if ($item.Unread -eq $true) {
                Write-Host "[$i] Subject: $($item.Subject)" -ForegroundColor Green
                Write-Host "    Sender:  $($item.SenderName) <$($item.SenderEmailAddress)>"
                Write-Host "    Time:    $($item.ReceivedTime)"
                Write-Host "    Snippet: $($item.Body.Substring(0, [Math]::Min(100, $item.Body.Length)).Replace("`r`n", " "))"
                Write-Host "------------------------------------------"
                $i++
            }
            $item = $items.GetNext()
        }
        if ($i -eq 1) {
            Write-Host "No unread emails found." -ForegroundColor Yellow
        }
    }

    "recent" {
        Write-Host "Fetching top $Count recent emails..." -ForegroundColor Cyan
        $items = $inbox.Items
        $items.Sort("[ReceivedTime]", $true)
        
        $item = $items.GetFirst()
        $i = 1
        while ($item -ne $null -and $i -le $Count) {
            $status = if ($item.Unread) { "[UNREAD]" } else { "[READ]" }
            Write-Host "[$i] $status Subject: $($item.Subject)" -ForegroundColor Green
            Write-Host "    Sender:  $($item.SenderName) <$($item.SenderEmailAddress)>"
            Write-Host "    Time:    $($item.ReceivedTime)"
            Write-Host "------------------------------------------"
            $i++
            $item = $items.GetNext()
        }
    }

    "draft" {
        if (-not $To -or -not $Subject) {
            Write-Host "Error: -To and -Subject are required for draft creation." -ForegroundColor Red
            exit 1
        }
        $mail = $outlook.CreateItem(0) # 0 = olMailItem
        $mail.To = $To
        $mail.Subject = $Subject
        $mail.Body = $Body
        $mail.Save()
        Write-Host "Draft saved successfully for $To with subject '$Subject'." -ForegroundColor Green
    }

    "send" {
        if (-not $To -or -not $Subject) {
            Write-Host "Error: -To and -Subject are required for sending mail." -ForegroundColor Red
            exit 1
        }
        $mail = $outlook.CreateItem(0)
        $mail.To = $To
        $mail.Subject = $Subject
        $mail.Body = $Body
        $mail.Send()
        Write-Host "Mail sent successfully to $To!" -ForegroundColor Green
    }

    default {
        Write-Host "Unknown Action: $Action. Valid actions: test, unread, recent, draft, send" -ForegroundColor Red
    }
}
