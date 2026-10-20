# ⚔️ Idle Runner RPG

Yatay ekranda soldan sağa koşan bir kahraman: önüne çıkan canavarları otomatik keser,
altın ve eşya toplar. Altınla yükseltme ve eşya alır, envanterden eşya kuşanır,
bossları yener, biyomlar arasında ilerler ve **Yeniden Doğuş** ile kalıcı güç kazanır.

Saf JavaScript (ES modülleri) + Canvas 2D. Hiçbir bağımlılık veya build adımı yok.

## Çalıştırma

```bash
npm start
```

Ardından tarayıcıda `http://localhost:5173` adresini aç.
(ES modülleri `file://` üzerinden yüklenemediği için küçük bir Node sunucusu kullanılıyor.)

Beş haritanın hareketli önizlemesi: sunucu açıkken `/tools/map-preview.html` adresini aç.

## Özellikler

- **Auto-runner savaş** — paralaks kayan dünya, temas olunca karşılıklı saldırı, kritik vuruş, can çalma
- **Katmanlı haritalar** — biyoma özel kalıntılar, uzak yapılar, su yansımaları, dokulu yollar ve yol kenarı fenerleri;
  ormanda ateş böcekleri, çölde piramitler, mağarada kristaller ve yeraltı şelaleleri, buzulda kutup ışıkları,
  volkanda dumanlı kraterler ve lav damarları. Süsleme ve zemin çizimleri önbelleğe alınır.
- **5 biyom** (Orman, Çöl, Mağara, Buzul, Volkan), her biri kendi canavarları ve bossu ile; her 10 bölgede biyom değişir
- **37 canavar** — 27 normal canavar ve 10 boss (her biyomda iki boss: 5. ve 10. bölgede), 7 farklı çizim şekli
  (balçık, mantar, hayalet, insansı, dört ayaklı, uçan, yılan)
- **Boss savaşları** — her 5 bölgede bir; süre sınırı bölgeyle uzar (45 sn'den başlar, her 5 bölgede +2 sn).
  Kalan can mevcut DPS ile eritilemeyecekse sayaç kırmızıya döner ve "yetişmez" yazar
- **Elit canavarlar** — %8 şansla çıkar; 3x can, 4x altın, daha iyi eşya. Her elit rastgele bir özellik taşır:
  Hızlı, Dev, Zırhlı, Vampir, Çılgın veya Altın (parıltı rengi özelliği gösterir)
- **Aktif yetenekler** — Güçlü Vuruş, Öfke, Altın Yağmuru, İlahi Şifa; oyun alanındaki çubuktan veya Q W E R ile, istersen otomatik
- **Demirci** — kuşanılan eşyaları +1 … +15 güçlendirme (maksimum seviye nadirliğe bağlı)
- **Rünler** — 6 tür (Yakut saldırı, Zümrüt can, Safir kritik hasar, Topaz altın, Ametist saldırı hızı, Oniks şans) × 10 kademe.
  Bosslardan, elitlerden, kuleden ve görevlerden düşer; 3 aynı rün altınla bir üst kademeye birleşir.
  Nadir+ eşyalarda yuva açılır (Nadir 1, Destansı/Efsanevi 2, Mitik 3); yuvaya tıkla tak/çıkar. Rün çantası kalıcıdır:
  satılan eşyadaki ve yeniden doğuşta silinen eşyalardaki rünler çantaya geri döner (Demirci › Rünler)
- **Yoldaşlar** — 6 yoldaş (Kurt Yavrusu, Altın Böceği, Bilge Baykuş, Orman Perisi, Taş Golemcik, Ejder Yavrusu), 4 nadirlik.
  Yumurta kuluçkada 120 öldürmede çatlar (boss 5 sayılır); yanındaki yoldaş koşucunun arkasında koşar, saldırır ya da iyileştirir,
  öldürmelerden deneyim kazanır (en fazla 50. seviye) ve pasif stat verir. Tekrar çıkan yoldaş deneyime dönüşür
- **Boss Kulesi** — 10. bölgeden sonra açılır. Günde 3 hak (+ görevlerden kule anahtarı); her giriş en yüksek katın üstünden
  başlar, kat başına 30 sn. İlk kez geçilen kat Ruh + rün, her 5. kat yumurta, her 10. kat büyük Ruh paketi verir.
  Kuledeyken bölge ilerlemesi donar; kulede ölmek bölge kaybettirmez
- **Günlük görevler** — her gün (yerel gece yarısı) 3 rastgele görev ve hepsini bitirme bonusu; 7 günlük giriş serisi ödülü.
  **Haftalık** (7 günde bir) ve **aylık** (ayda bir) hedefler daha büyük ödüllü; yeni görev türleri (yükseltme, yoldaş seviyesi, iksir, yuva, rün birleştirme).
  Hedefler sekmesinde başarımlarla birlikte; oyun ekranındaki 🎯 düğmesi görev penceresini açar (günlük, haftalık, aylık ve giriş takvimi).
- **Başarımlar** — 27 grupta 80+ kademeli başarım (kule, yoldaş, rün ve günlük görev grupları dahil; canavar bilgini, tam teçhizat, set kuşanan, silah ustası, hızlı cellat…);
  her biri kalıcı +%2 saldırı ve altın verir
- **Eşya sistemi** — 10 yuva (Kask, Kolye, Pelerin, Silah, Kalkan, Zırh, Eldiven, Kemer, Yüzük, Çizme),
  6 nadirlik (Sıradan → Mitik), 7 seviye kademesi, seviyeye göre ölçeklenen rastgele statlar
- **Eşya setleri** — 5 set (Kızıl Nişan, Buzul Siperi, Fırtına Örtüsü, Yaşam Yemini, Kâhin Gözü), her biri 6 yuva kapsar.
- **Karakter sınıfları** — Savaşçı (varsayılan), Okçu, Büyücü, Suikastçı, Şifacı. Her sınıf kendi silah türünü ve zırh sınıfını kuşanır;
  diğer sınıfların eşyaları envanterde durur ama kuşanılamaz. Sınıf açmak **Kule Mührü** (🔷) harcar; her Boss Kulesi kat geçişi 1 mühür verir. Sınıflar **elmasla** (💎) da açılabilir.
- **Elmas** (💎) — bosslardan (%35), Boss Kulesi kat geçişlerinden, haftalık/aylık/günlük hedef bonuslarından ve başarımlardan kazanılır.
  Elmasla **Nadir Hazine** (mitik eşya), **İksir Sandığı** ve **Rün Hazinesi** alınır; sınıf açılabilir. Prestijde silinmez.
  Geçiş ücretsizdir ve her sınıfın ekipmanı ayrı saklanır. Yeniden doğuşta ekipmanlar silinir, açılan sınıflar kalır.
  Nadir ve üstü eşyalar set parçası olabilir (nadirlik arttıkça şans artar); aynı setten **2 / 4 / 6 parça**
  kuşanınca kademeli bonus açılır. Parçalar yuva kenarındaki elmasla işaretlenir, Karakter sekmesinde
  aktif bonuslar özetlenir ve tooltip "kuşanılırsa kaç parça olur"u gösterir. Set parçaları **oto-satıştan muaftır**
- **7 silah türü** — Kılıç, Balta (+kritik hasar), Çekiç (+boss hasarı, en yüksek saldırı), Mızrak (+kritik şansı),
  Hançer (+saldırı hızı), Yay (+kaçınma), Asa (+yenilenme); her biri karakterin elinde farklı çizilir
- **Statlar** — saldırı, can, zırh, yenilenme, saldırı hızı, kritik, can çalma, altın, şans,
  **kaçınma**, **diken** (vurulunca geri hasar) ve **boss hasarı**
- **Envanter** — 30 yuva (altın ile +5 yuvalık 6 genişletmeye kadar, Ruh Ağacı yuvaları ile birlikte); kuşan / sat / kilitle / sırala (yuva, nadirlik, seviye, değer, güç);
  filtre (sınıfta kuşanılabilir, ▲ daha iyi, kilitli, set); **Seç** modu ile birden çok eşyayı sat veya kilitle; tooltip'te kuşanılanla stat karşılaştırması
  ve başka sınıfa ait eşyalar için uyarı; "En İyileri Kuşan". Oto-sat ve toplu sat; ▲ daha iyi, set, kilitli ve boş yuvanın ihtiyacı olan eşyaları korur ve onaylı satar.
- **Görsel ekipman** — kuşandığın eşyaların nadirlik rengi karakterin üzerinde görünür (kılıç parlaması, pelerin, kask...)
- **Kağıt bebek (Karakter sekmesi)** — ekipman 5+5 dikey dizilir, ortada kuşanılan on parçayı
  anlık gösteren önden bir figür durur: kask, zırh, omuzluk, kolye, kemer, eldiven, çizme, pelerin,
  sol elde kalkan, sağ elde silah (silah türü kendi çizimiyle). Yuvalar figürün gövde hizasına
  denk gelir (kask baş, kemer bel, çizme ayak); kilitli yuvalar figürde boş kalır
- **12 yükseltme** — x1 / x10 / MAX satın alma (satırda **Shift**=x10, **Ctrl**=MAKS);
  **kilometre taşları** (her 25 seviyede etki ×2); **tahmini verim** çubuğu ("⚡ en iyisini al"
  altın başına en çok kazandıranı seçer), sıralama / filtre / arama; ilk yeniden doğuştan sonra
  **otomatik alım** (öncelik profili: en ucuz / verim / hasar / hayatta kalma / altın)
- **Mağaza** — dört bölüm: **Eşyalar** (5 dakikada bir yenilenen vitrin, ücretli yenileme; ▲ işaretli ve güç farkı yüzdeli eşyalar),
  **Sandıklar** (Tahta / Demir / Altın), **İksirler** (Can İksiri + süreli iksirler) ve **Özel** (Rün Paketi, Yoldaş Yumurtası, Kule Anahtarı).
  Sandık, iksir ve özel ürünler **×1 / ×5 / ×10** toplu alınabilir. Her gün bir ürün **%25 indirimli** (yerel güne göre sabit).
- **Tehlikeli düşmanlar** — bosslar her 4., elitler her 5. saldırıda zırhı yarı delen **ağır vuruş** yapar;
  öncesinde kırmızı parıltı ve "⚠ Ağır vuruş geliyor!" uyarısı çıkar
- **Yeniden Doğuş + Ruh Ağacı** — 20. bölgeden sonra yeniden doğ (ilerleme durunca HUD öneri düğmesi çıkar): temiz bir koşu
  başlar (envanter, ekipman, yetenekler, iksirler ve mağaza da sıfırlanır), Ruh kazanılır ve 5 dallı, 25 düğümlü
  teknoloji ağacında harcanır (aşağıya bak)
- **Kabus döngüleri** — her 50 bölgede biyomlar baştan döner ama canavarlar ×6 can, ×3.5 saldırı, ×3 altınla gelir;
  içerik hiç bitmez, her duvar yeniden doğmaya ve ağacı büyütmeye davet eder
- **Çevrimdışı kazanç** — oyun kapalıyken altın (en fazla 8 saat). Sekme arka plana atıldığında oyun
  tamamen durur ve ödül tek seferlik verilir; arka planda sessizce kazanç birikmez
- **Duraklatma** — üst bardaki ⏸ düğmesi veya **P** tuşu; duraklatırken ilerleme kaydedilir
- **Ses** — vuruş, kritik, boss, eşya, yetenek, yeniden doğuş için prosedürel ses efektleri.
  Hazır ses dosyası yok; hepsi osilatörle üretilir. Ayarlardan kapatılabilir, düzeyi kaydırıcıyla ayarlanır
- **Kayıt** — otomatik kayıt, dışa/içe aktarma, sıfırlama. İçe aktarılan kayıtlar doğrulanır:
  bilinmeyen alanlar, geçersiz yuvalar ve şişirilmiş değerler temizlenir
- **Oyun hızı** — 1x / 2x / 3x
- **Tek ekran düzeni** — sayfa kaymaz; sol menüde bildirim rozetleri (daha iyi eşya, alınabilir yükseltme, yeni başarım…)
- **Gizlenebilir alt menü** — üst bardaki "▼ Menü" düğmesi veya **M** tuşu; gizliyken oyun alanı tüm ekranı kullanır
- **HUD** — can, bölge plakası (10 öldürme hücresi), aktif yetenek/iksir süreleri, son ganimetler akışı

## Ruh Ağacı

Yeniden doğuşta altın, altın yükseltmeleri, bölge, **envanter ve kuşanılan ekipman**, yetenek seviyeleri,
iksirler ve mağaza vitrini sıfırlanır; Ruh kazanılır — yani her yeniden doğuş temiz bir koşudur.
Ruh Ağacı, Ruhlar, başarımlar ve istatistikler korunur. Kazanılan her Ruh ayrıca kalıcı **Ruh gücü** verir
(+%0.5 saldırı/can/altın).
Düğümler soldan sağa açılır (önceki düğümde en az 1 seviye gerekir); bazıları başka daldan da şart koşar.

| Dal | Düğümler (soldan sağa) |
|---|---|
| ⚔️ Savaş | Saldırı % → Kritik şansı → Boss hasarı → Boss süresi + → Kritik hasarı |
| 🛡️ Hayatta Kalma | Can % → **Kalkan yuvası** → Kaçınma → **İlahi Şifa** yeteneği → Diken |
| 💰 Servet | Altın % → Ruh kazancı → Altın mirası → Başlangıç bölgesi → Fiyat indirimi |
| 🎒 Teçhizat | **Envanter +5/sv.** → **Eldiven yuvası** → **Kemer yuvası** → **Pelerin yuvası** → Çifte ganimet |
| ✨ Büyü | Bekleme süresi − → **Altın Yağmuru** yeteneği → Yetenek gücü → Otomatik boss denemesi → **Kıyamet Meteoru** (özel, sadece buradan) |

Başlangıçta 6 ekipman yuvası açıktır; Kalkan, Eldiven, Kemer ve Pelerin ağaçtan açılır.

## Menü ve Kısayollar

| Sekme | Kısayol | İçerik |
|---|---|---|
| 🎒 Karakter | 1 | Ekipman, envanter, statlar |
| 🎭 Sınıflar | 2 | Karakter sınıfları: tasarımları, silah/zırh türleri, açma ve geçiş |
| ⬆️ Yükseltmeler | 3 | Altınla kalıcı (yeniden doğuşa kadar) stat yükseltmeleri |
| ✨ Yetenekler | 4 | Yetenek öğrenme / yükseltme / otomatik kullanım |
| 🔨 Demirci | 5 | Eşya güçlendirme · rün çantası ve yuvalar |
| 🐾 Yoldaşlar | 6 | Yumurta/kuluçka ve yoldaş koleksiyonu |
| 🏪 Mağaza | 7 | İksirler ve eşya vitrini |
| 🗼 Boss Kulesi | 8 | Günlük haklar, sıradaki katlar ve ödülleri |
| 🏆 Hedefler | 9 | Günlük görevler, giriş serisi ve başarımlar |
| 🌳 Ruh Ağacı | 10 | Yeniden doğuş ve kalıcı yükseltme ağacı |

Diğer kısayollar: **Q W E R T** yetenekler · **F** iksir · **B** ilerle / boss · **M** menüyü gizle/göster ·
**P** duraklat/devam et · **Esc** ayarlar · **Ctrl+tık** eşya kilitle.
Ayarlar, kayıt işlemleri ve istatistikler üst bardaki ⚙️ butonundadır.

## Dosya Yapısı

```
├── index.html               Sayfa iskeleti (canvas + HUD + paneller)
├── server.js                Bağımlılıksız statik sunucu
├── assets/fonts/            Yerel yazı tipleri (woff2) + lisansları
├── test/                    node:test paketi (npm test) — denge, kayıt, setler, veri tutarlılığı
├── tools/                   Geliştirici araçları
│   ├── balance-model.mjs    Denge modeli (oyunun gerçek formülleriyle ölçüm)
│   ├── balance-probe.mjs    Denge raporu (npm run balance)
│   └── map-preview.html     Beş haritanın hareketli önizlemesi
├── css/
│   ├── fonts.css            @font-face tanımları (yerel yazı tipleri)
│   ├── base.css             Tema token'ları (renk, kabartma, yazı tipi), genel stiller
│   ├── hud.css              Üst bar + oyun alanı üstü bilgi katmanı
│   ├── panels.css           Alt menü ve tüm sekme panelleri
│   ├── components.css       Buton, eşya kutusu, tooltip, toast, modal
│   └── features.css         Rün, yoldaş, kule ve günlük görev panelleri
└── src/
    ├── main.js              Giriş noktası
    ├── config/
    │   ├── constants.js     Ekran, zamanlama, envanter vb. sabitler
    │   └── balance.js       TÜM denge formülleri (oyunu ayarlamak için burası)
    ├── core/
    │   ├── Game.js          Kompozisyon kökü: sistemleri kurar, tick sırasını belirler
    │   ├── GameLoop.js      requestAnimationFrame döngüsü
    │   ├── EventBus.js      Yayınla/abone ol
    │   ├── events.js        Olay isimleri
    │   ├── GameState.js     Kaydedilen durumun şekli (varsayılanlar)
    │   ├── saveIntegrity.js Sürüm geçişleri + kayıt doğrulama (dışarıdan gelen kaydı temizler)
    │   └── SaveManager.js   localStorage, dışa/içe aktarma
    ├── data/                Saf veri — yeni içerik eklemek için
    │   ├── monsters.js      Canavarlar ve bosslar
    │   ├── eliteTraits.js   Elit canavar özellikleri
    │   ├── soulTree.js      Ruh Ağacı dalları ve düğümleri
    │   ├── shop.js          Mağaza kataloğu: süreli iksirler ve hazine sandıkları
    │   ├── biomes.js        Biyomlar (renkler, süsleme, canavar havuzu)
    │   ├── items.js         Eşya yuvaları, taban eşyalar ve silah türleri
    │   ├── sets.js          Eşya setleri (2/4/6 parça bonusları) ve parça sayma
    │   ├── rarities.js      Nadirlikler
    │   ├── stats.js         Stat tanımları
    │   ├── upgrades.js      Yükseltmeler
    │   ├── skills.js        Aktif yetenekler
    │   ├── achievements.js  Kademeli başarımlar
    │   ├── runes.js         Rün türleri, kademe değerleri, birleştirme/yuva maliyetleri
    │   ├── companions.js    Yoldaşlar, nadirlikler, seviye eğrisi
    │   ├── tower.js         Boss Kulesi: kat ölçeği, haklar, kat ödülleri
    │   └── quests.js        Günlük görev şablonları, giriş serisi ödülleri, gün anahtarı
    ├── entities/
    │   ├── Entity.js        Ortak can/hasar/animasyon zamanı
    │   ├── Player.js
    │   └── Monster.js       Bölgeye göre ölçeklenen canavar (normal / elit / boss)
    ├── systems/             Oyun mantığı (render'dan bağımsız)
    │   ├── StatsSystem.js       Taban + yükseltme + ekipman + set bonusu + buff + ruh + başarım → nihai statlar
    │   ├── CombatSystem.js      Temas, saldırılar, ölüm, yeniden doğma
    │   ├── SpawnSystem.js       Canavar doğurma, bölge ilerlemesi, boss zamanlayıcı
    │   ├── EconomySystem.js     Altın, saniyelik kazanç ortalaması
    │   ├── LootSystem.js        Eşya düşürme
    │   ├── ItemFactory.js       Eşya üretimi, nadirlik zarı, set zarı, eşya puanı, güçlendirilmiş statlar
    │   ├── InventorySystem.js   Ekle / sat / kilitle / sırala
    │   ├── EquipmentSystem.js   Kuşan / çıkar / en iyileri kuşan
    │   ├── SkillSystem.js       Yetenekler: bekleme süreleri, bufflar, otomatik kullanım
    │   ├── ForgeSystem.js       Demirci: eşya güçlendirme
    │   ├── AchievementSystem.js Başarım kontrolü
    │   ├── UpgradeSystem.js     Toplu satın alma hesapları, oto-alım profilleri
    │   ├── UpgradeAdvisor.js    Yükseltme danışmanı: kazanç oranı, verim, öncelik profilleri (saf)
    │   ├── ShopSystem.js        Vitrin + iksir
    │   ├── PotionSystem.js      Otomatik/manuel can iksiri
    │   ├── ElixirSystem.js      Süreli iksirler (stat bonusu, kayıtla korunur)
    │   ├── PrestigeSystem.js    Yeniden doğuş (Ruh hesabı, korunan altın, başlangıç bölgesi, danışman)
    │   ├── SoulTreeSystem.js    Ruh Ağacı: satın alma, ön koşullar, perk/stat/yuva/yetenek etkileri
    │   ├── RuneSystem.js        Rün çantası, düşürme, birleştirme, yuva açma, tak/çıkar/iade
    │   ├── CompanionSystem.js   Yumurta/kuluçka, yoldaş deneyimi, savaşta saldırı/iyileştirme
    │   ├── TowerSystem.js       Boss Kulesi: giriş, kat bossu, kat ödülleri, çıkış
    │   ├── QuestSystem.js       Günlük görevler, giriş serisi, gün değişimi (kule haklarını da yeniler)
    │   ├── rewards.js           Görev/kule/giriş ödüllerinin ortak biçimi ve verilmesi
    │   ├── OfflineSystem.js     Çevrimdışı ödül
    │   └── AudioSystem.js       Prosedürel ses efektleri (olaylara abone olur, dosya yok)
    ├── render/
    │   ├── Renderer.js          Çizim sırası, ekran sarsıntısı, afişler, can barları
    │   ├── Background.js        Prosedürel paralaks biyom arka planı
    │   ├── EnvironmentLayer.js  Önbellekli çevre katmanları, su, yol dokuları ve atmosfer
    │   ├── ParticleSystem.js    Partiküller (kıvılcım, altın, halka, kesik)
    │   ├── FloatingTextSystem.js Hasar / altın yazıları
    │   ├── EffectsController.js Olay → görsel efekt eşlemesi
    │   ├── SpriteOutliner.js    Sprite'lara piksel dış hattı
    │   └── sprites/             Prosedürel çizimler: oyuncu (dünya + paneldeki kağıt bebek), süsleme ve monsters/ (şekil başına bir dosya)
    ├── ui/
    │   ├── UIManager.js         Sol menü, rozetler, kısayollar, modal/toast yönlendirme
    │   ├── HUD.js               Altın, can, bölge, boss süresi, hız, yetenek/iksir çubuğu, bufflar
    │   ├── SettingsModal.js     Ayarlar, kayıt işlemleri, kısayollar, istatistikler (⚙️)
    │   ├── components/          Tooltip, Toast, Modal, ItemSlot
    │   └── panels/              Karakter, Yükseltmeler, Yetenekler, Demirci (+Rünler), Yoldaşlar, Mağaza, Boss Kulesi, Hedefler, Yeniden Doğuş
    └── utils/                   format, random, math, dom yardımcıları
```

## Görsel Tasarım

- **Piksel sanat dünyası:** Dünya, mantıksal birimin yarısı çözünürlükte ayrı bir tuvale çizilir ve yumuşatmasız büyütülür
  (`render/Renderer.js`). Oyuncu ve canavarlar `SpriteOutliner` ile 1 piksellik koyu dış hat alır.
  Yazılar, can barları ve afişler tam çözünürlükte üst katmana çizilir. Ayarlar → "Piksel sanat görünümü" ile kapatılabilir.
- **Harita katmanları:** gökyüzü, güneş ışınları/yıldızlar, bulutlar, kenar ışıklı dağlar, pus, uzak siluetler,
  yakın süslemeler, patikalı zemin, ortam partikülleri ve karakterlerin önünden geçen ön plan.
- **Arayüz teması:** zindan taşı paneller, pirinç çerçeveler, parşömen yazı (`css/base.css` içindeki token'lar).
  Yazı tipleri projeye gömülüdür (`assets/fonts/`, `css/fonts.css`): başlık/sayı için *Pixelify Sans*,
  açıklamalar için *Jost*. İkisi de SIL Open Font License 1.1 ile lisanslıdır; internet gerekmez.

## Mimari Notlar

- **Durum ↔ çalışma anı ayrımı:** Kaydedilen her şey `game.state` içindeki düz bir JSON nesnesidir.
  Oyuncu canı, canavarlar, partiküller kaydedilmez.
- **Olay tabanlı iletişim:** Sistemler birbirini mümkün olduğunca doğrudan çağırmaz; `EventBus` üzerinden
  haberleşir. Örn. `MONSTER_KILLED` olayını Ekonomi (altın), Loot (eşya), Spawn (ilerleme) ve
  EffectsController (görsel) ayrı ayrı dinler.
- **Mantık ve görsel ayrı:** `systems/` hiçbir çizim kodu içermez; `render/` oyun kurallarını bilmez.

## İçerik Eklemek

| Ne eklemek istiyorsun? | Nereye? |
|---|---|
| Yeni canavar | `src/data/monsters.js` → sonra `biomes.js`'te bir biyomun `monsters` listesine ekle |
| Yeni canavar şekli | `src/render/sprites/monsters/` altına çizim fonksiyonu yaz, `index.js`'teki `SHAPES`'e ekle |
| Yeni elit özelliği | `src/data/eliteTraits.js` |
| Yeni silah türü | `src/data/items.js` → `WEAPON_KINDS` + `render/sprites/PlayerSprite.js` → `WEAPON_DRAWERS` |
| Yeni biyom | `src/data/biomes.js` (gerekirse `render/sprites/DecorSprites.js`'e süsleme ekle) |
| Yeni eşya tabanı / yuva | `src/data/items.js` |
| Yeni eşya seti | `src/data/sets.js` → 6 yuva + 2/4/6 bonusları; bonuslar **yüzde** statı olmalı (düz statlar yüksek seviyede değersiz kalır). Simge gerekiyorsa mevcut bir simgeyi paylaştır (`ui/icons.js`) |
| Yeni eşya tabanı | `src/data/items.js` |
| Yeni eşya yuvası | `src/data/items.js` (`SLOTS`) + `ui/panels/CharacterPanel.js` (`DOLL_SLOTS_LEFT/RIGHT`) + `render/sprites/PlayerSprite.js` (`playerDollBox` taban kutusu) + `core/saveIntegrity.js` (`sanitizeItem`) |
| Yeni stat | `src/data/stats.js` + `config/balance.js` (PLAYER_BASE) + `systems/StatsSystem.js` |
| Yeni yükseltme | `src/data/upgrades.js` |
| Yeni yetenek | `src/data/skills.js` (kind: strike / buff / heal) |
| Yeni başarım | `src/data/achievements.js` |
| Yeni Ruh Ağacı düğümü | `src/data/soulTree.js` (yeni perk anahtarıysa onu okuyan sisteme `game.tree.perk('anahtar')` ekle) |
| Yeni menü sekmesi | `src/ui/panels/` altına panel yaz, `UIManager.js` içindeki `tabs` dizisine ekle |
| Zorluk ayarı | `src/config/balance.js` (canavar büyümesi, ağır vuruş, Kabus çarpanları, Ruh eğrisi). Etkisini `npm run balance` ile ölç; `test/balance-curve.test.js` eğrinin sözleşmesini korur |
| Yeni iksir / sandık | `src/data/shop.js` |
| Yeni ses efekti | `src/systems/AudioSystem.js` içindeki `RECIPES` (osilatör tarifi) + `EVENT_SOUNDS` (hangi olay hangi sesi çalar) |

## Testler ve Denge

```bash
npm test           # node:test — denge eğrisi, kayıt doğrulama, eşya setleri, kağıt bebek çerçevesi, yeniden doğuş sıfırlaması, yükseltme danışmanı ve profilleri, ses eşlemesi, veri tutarlılığı
npm run balance    # Bölge bölge güç tablosu ve duvarların yeri
npm run balance 60 120   # yalnızca 60-120 aralığını göster (duvarlar tüm eğriden hesaplanır)
```

`tools/balance-model.mjs` oyunun gerçek formüllerini (`balance.js`, `upgrades.js`, `monsters.js`) kullanır;
ekipman, yetenek ve Ruh Ağacı modellenmez, yani çıkan sonuç **alt sınırdır**. Modelin koruduğu kararlar:

1. **Boss sayacı, can duvarından önce gelmez.** Aksi halde oyuncu öldürülemeyen bir düşman yerine
   görünmez bir sayaçla durur.
2. **İlk yeniden doğuş (20. bölge) ekipmansız da erişilebilir.** Duvar 29-31 civarındadır.
3. **Canavar gücü oyuncudan hızlı büyür**, böylece yeniden doğuş anlamlı kalır.

Bu sözleşmeler testle kilitlidir; bir denge değişikliği bunları bozarsa `npm test` kırılır.

**Setler ve denge:** set bonusları yüzde statı olduğu için eşya statlarıyla **toplanır**, ayrı çarpan değildir;
dolayısıyla denge modelini (ekipmansız alt sınır) kaydırmaz. Aynı sebeple 6 parçalık bir set, yüksek bölgelerde
tek bir iyi eşyadan daha değerli kalır. Set puanlaması (`ItemFactory.setPieceRating`) setin tüm bonusunu son
kademenin parça sayısına böler: "En İyileri Kuşan" ve ▲ işareti böylece set parçalarını görmezden gelmez.
Kaba bir tahmindir — tek parça bulan oyuncu için bonus gerçekte sıfırdır.

## Geliştirici İpuçları

Tarayıcı konsolunda `game` nesnesine erişebilirsin:

```js
game.economy.addGold(1e6)      // altın ekle
game.spawn.setStage(30)        // bölgeye ışınlan
game.state.potions = 99
```
