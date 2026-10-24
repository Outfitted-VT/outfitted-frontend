Add-Type -AssemblyName System.Drawing

$base = "c:\Users\arihi\Documents\antigravity\hopeful-brahmagupta\outfitted-vibe"
$feedDir = Join-Path $base "assets\feed"
$brandDir = Join-Path $base "assets\branding"
$wardrobeDir = Join-Path $base "assets\wardrobe"

New-Item -ItemType Directory -Path $feedDir -Force | Out-Null
New-Item -ItemType Directory -Path $brandDir -Force | Out-Null
New-Item -ItemType Directory -Path $wardrobeDir -Force | Out-Null

$extracted = Join-Path $base "assets\extracted"

# 1. Main Feed Image 19
$img19Path = Join-Path $extracted "image19.png"
if (Test-Path $img19Path) {
    $bmp19 = [System.Drawing.Bitmap]::new($img19Path)
    
    # Maya Chen card photo: (326, 411, 359, 270) approx image region
    # Let's inspect where the photo itself is: header is Maya Chen @mayamakesfits, photo starts at Y=411 to Y=678 (THE FIT FILES / 01 is overlay)
    $mayaPhoto = $bmp19.Clone([System.Drawing.Rectangle]::new(326, 411, 358, 270), $bmp19.PixelFormat)
    $mayaPhoto.Save((Join-Path $feedDir "maya_fit.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $mayaPhoto.Dispose()

    # Jordan Lee card photo:
    $jordanPhoto = $bmp19.Clone([System.Drawing.Rectangle]::new(725, 411, 358, 270), $bmp19.PixelFormat)
    $jordanPhoto.Save((Join-Path $feedDir "jordan_fit.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $jordanPhoto.Dispose()

    $bmp19.Dispose()
    Write-Host "Cropped Maya & Jordan"
}

# 2. Alex Kim card photo from image5.png
$img5Path = Join-Path $extracted "image5.png"
if (Test-Path $img5Path) {
    $bmp5 = [System.Drawing.Bitmap]::new($img5Path)
    $alexPhoto = $bmp5.Clone([System.Drawing.Rectangle]::new(279, 187, 344, 345), $bmp5.PixelFormat)
    $alexPhoto.Save((Join-Path $feedDir "alex_fit.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $alexPhoto.Dispose()
    $bmp5.Dispose()
    Write-Host "Cropped Alex"
}

# 3. Branding logos & App Icons
Copy-Item (Join-Path $extracted "image6.png") (Join-Path $brandDir "logo_star.png") -Force
Copy-Item (Join-Path $extracted "image13.png") (Join-Path $brandDir "icon_circle_of.png") -Force
Copy-Item (Join-Path $extracted "image8.png") (Join-Path $brandDir "icon_hanger.png") -Force
Copy-Item (Join-Path $extracted "image2.png") (Join-Path $brandDir "icon_of_ligature.png") -Force
Copy-Item (Join-Path $extracted "image9.png") (Join-Path $brandDir "icon_blazer_arch.png") -Force
Copy-Item (Join-Path $extracted "image7.png") (Join-Path $brandDir "icon_cube_hanger.png") -Force
Copy-Item (Join-Path $extracted "image3.png") (Join-Path $brandDir "icon_chat_hanger.png") -Force
Copy-Item (Join-Path $extracted "image4.png") (Join-Path $brandDir "loading_screen.png") -Force

# 4. Wardrobe and Lookbooks
Copy-Item (Join-Path $extracted "image16.png") (Join-Path $wardrobeDir "wardrobe_collage.png") -Force
Copy-Item (Join-Path $extracted "image1.png") (Join-Path $feedDir "about_me_reactions.png") -Force
Copy-Item (Join-Path $extracted "image20.png") (Join-Path $brandDir "lookbook_fog.png") -Force
Copy-Item (Join-Path $extracted "image17.png") (Join-Path $brandDir "lookbook_welcome.png") -Force
Copy-Item (Join-Path $extracted "image15.png") (Join-Path $brandDir "lookbook_banda.png") -Force
Copy-Item (Join-Path $extracted "image18.png") (Join-Path $brandDir "lookbook_dollhouse.png") -Force
Copy-Item (Join-Path $extracted "image14.png") (Join-Path $brandDir "lookbook_hush.png") -Force
Copy-Item (Join-Path $extracted "image10.png") (Join-Path $brandDir "health_ui_dial.png") -Force

Write-Host "Assets organized successfully!"
