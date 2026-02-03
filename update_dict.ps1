$solutionsUrl = "https://raw.githubusercontent.com/Kinkelin/WordleCompetition/main/data/official/shuffled_real_wordles.txt"
$guessesUrl = "https://raw.githubusercontent.com/Kinkelin/WordleCompetition/main/data/official/official_allowed_guesses.txt"
$outputFile = "d:/wordle/static/js/data.js"

Write-Host "Downloading word lists..."

try {
    $solutions = (Invoke-RestMethod -Uri $solutionsUrl).Trim() -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
    $guesses = (Invoke-RestMethod -Uri $guessesUrl).Trim() -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }

    Write-Host "Downloaded $($solutions.Count) solutions and $($guesses.Count) guesses."

    $jsContent = @"
// Authentic Wordle word lists sourced from Kinkelin/WordleCompetition
// Generated automatically by PowerShell

// $($solutions.Count) Solution Words
const ANSWERS = "$($solutions -join " ")".split(" ");

// $($guesses.Count) Allowed Guesses
const ALLOWED_GUESSES = "$($guesses -join " ")".split(" ");
"@

    Set-Content -Path $outputFile -Value $jsContent -Encoding UTF8
    Write-Host "Successfully wrote to $outputFile"
} catch {
    Write-Error "Failed: $_"
}
