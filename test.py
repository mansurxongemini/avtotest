import os
import requests

# Saytning asosiy manzili
BASE_URL = "https://ferdavs-avtotest.vercel.app/"

# Loyihaning rasmdagi 100% to'liq fayllar ro'yxati
files_to_download = [
    "index.html",
    "logo.png",
    "logoSvg.png",
    
    # Config
    "config/api.config.js",
    
    # Data papkasi
    "data/answers.js",
    "data/data.js",
    "data/newQuestions.js",
    "data/questions.js",
    
    # Scripts - Asosiy va ichki modullar
    "scripts/main.js",
    "scripts/components/imgModal.js",
    "scripts/components/newTest.js",
    "scripts/utils/Auth.js",
    "scripts/utils/LanguageSwitcher.js",
    
    # Styles papkasi
    "styles/components.css",
    "styles/main.css",
    "styles/responsive.css",
    
    # Assets - Shriftlar (Inter font-family)
    "assets/Inter/static/Inter_18pt-Bold.ttf",
    "assets/Inter/static/Inter_18pt-Medium.ttf",
    "assets/Inter/static/Inter_18pt-Regular.ttf",
    "assets/Inter/static/Inter_18pt-SemiBold.ttf",
    
    # Assets - Media va piktogrammalar
    "assets/arrowLeft.svg",
    "assets/arrowRight.svg",
    "assets/book.png",
    "assets/graduate.png",
    "assets/language.png",
    "assets/test.png",
    "assets/timer.png"
]

def download_site():
    print("=== AVTO TEST LOYIHASINI YUKLASH BOSHLANDI ===\n")
    
    # VPN yoqilgan holatda requests ishlashi uchun sessiya ochamiz
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    
    for file_path in files_to_download:
        # Fayl yuklanadigan to'liq URL manzil
        url = BASE_URL + file_path
        local_path = file_path
        
        if file_path == "index.html":
            url = BASE_URL  # Asosiy sahifa odatda to'g'ridan-to'g'ri root URLda bo'ladi
            
        # Mahalliy kompyuterda kerakli papka iyerarxiyasini avtomatik yaratish
        folder = os.path.dirname(local_path)
        if folder and not os.path.exists(folder):
            os.makedirs(folder)
            
        print(f"Yuklanmoqda: {file_path} ...", end=" ")
        
        try:
            response = session.get(url, timeout=15)
            
            # Agar index.html asosiy yo'ldan topilmasa, (index) sifatida qayta urinib ko'radi
            if response.status_code != 200 and file_path == "index.html":
                response = session.get(BASE_URL + "(index)", timeout=15)
                
            if response.status_code == 200:
                with open(local_path, "wb") as f:
                    f.write(response.content)
                print("[OK]")
            else:
                print(f"[XATOLIK - Status: {response.status_code}]")
                
        except Exception as e:
            print(f"[XATOLIK - {e}]")
            
    print("\n=== YUKLASH YAKUNLANDI ===")
    print("Barcha fayllar papka strukturasi bilan saqlandi.")

if __name__ == "__main__":
    download_site()