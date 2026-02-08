# Update manifests to use local images for verification
$manifests = Get-ChildItem "k8s/*.yaml"

foreach ($file in $manifests) {
    $content = Get-Content $file.FullName
    
    # Replace GHCR images with local ones
    $content = $content -replace "ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend:\$\{IMAGE_TAG\}", "genesis-backend:latest"
    $content = $content -replace "ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-frontend:\$\{IMAGE_TAG\}", "genesis-frontend:latest"
    
    # Ensure imagePullPolicy is IfNotPresent
    if ($content -match "image: genesis-") {
        # Find the line index of the image
        for ($i=0; $i -lt $content.Length; $i++) {
            if ($content[$i] -match "image: genesis-") {
                $nextIndex = $i + 1
                $hasPullPolicy = $false
                if ($nextIndex -lt $content.Length) {
                    $hasPullPolicy = $content[$nextIndex] -match "imagePullPolicy:"
                }

                if (-not $hasPullPolicy) {
                    # Insert imagePullPolicy on the next line
                    $newContent = $content[0..$i]
                    $newContent += "          imagePullPolicy: IfNotPresent"
                    $newContent += $content[($i+1)..($content.Length-1)]
                    $content = $newContent
                }
                break
            }
        }
    }
    
    $content | Set-Content $file.FullName
}

Write-Host "✅ Updated manifests to use local images" -ForegroundColor Green
