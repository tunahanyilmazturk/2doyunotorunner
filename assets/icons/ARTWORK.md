# Idle Runner — özel ikon seti

292 original generated icon identifiers across eight transparent PNG atlases. The latest extension adds 7 dedicated assassin dagger illustrations and replaces the generic dagger artwork; the earlier 82-cell extension added art for other newly introduced content. Generated with the built-in ImageGen tool. No external icon pack or emoji image exports.

## Kullanım

- Koleksiyon: http://localhost:5173/assets/icons/catalog.html
- `manifest.json`: all 292 identifiers, Turkish labels and zero-based atlas coordinates.
- `src/ui/icons.js`: UI icon renderer, equipment-level selection and legacy text decorations.
- `src/render/IconRenderer.js`: the same atlas art in Canvas combat labels and banners.
- Equipment visual tiers use item level thresholds 1, 6, 14, 25, 40, 60, 85. Rarity remains represented by the existing item-slot border, independent of appearance.
- Achievements use 21 group emblems; tier progress remains in the existing pips and Roman-numeral titles.
- New class crests, class abilities, nine set emblems, six rune stones, eight companion portraits, egg, elixir effects, tower and quest rewards are mapped to dedicated art.
- All eight weapon kinds have seven dedicated tier illustrations, including assassin daggers.
- No save format or balance changes.

## Yeni atlaslar

### weapons-v2.png

3 columns × 7 rows, ordered by progression tier from left to right: bow, wizard staff, healer scepter. Rows progress through wood, iron, polished steel, rune, mithril, dragon-forged and celestial star-metal. The weapons retain recognizable silhouettes and the same outline and pixel shading as the original set.

Prompt: “Create a perfectly aligned transparent sprite sheet with exactly 3 columns and 7 rows, one original standalone weapon icon centered in every equal-size cell. The three columns are bow, wizard staff and healer scepter. The seven rows progress through crude wood, iron, polished steel, rune-enchanted, mithril, dragon-forged and celestial star-metal. Keep each weapon silhouette recognizable at 24–32 px. Match the supplied pixel-fantasy reference: crisp handcrafted 32-bit pixel art, square pixels, dark plum outlines, upper-left highlights and jewel colors. No text, labels, grid lines, cell backgrounds, extra objects or watermarks.”

### assassin-daggers-v2.png

3 columns × 3 rows: seven assassin dagger tiers in row-major order; the last two cells are intentionally empty. The atlas replaces the shared dagger icons with a class-specific rogue progression.

Prompt: “Create a transparent square 3-column by 3-row sprite atlas for an established 2D pixel fantasy idle RPG. Exactly seven distinct centered assassin dagger icons occupy the first seven cells in strict row-major order; leave cells 8 and 9 completely empty and transparent. All cells equal squares, crisp clear separation by transparent space, no grid lines, no cell backgrounds, no frame. Progression for the seven daggers: (1) worn dark iron rogue shiv with brown leather grip, (2) polished iron stiletto with a small crimson gem, (3) Assassin's Fang, twin-edged curved black-steel dagger with deep red accents, (4) shadow rune dagger with violet runes and smoky purple edge, (5) mithril whisper blade with cyan steel and pale blue jewel, (6) dragon claw assassin dagger with black-red scales and ember orange edge, (7) celestial night twin dagger with violet star metal, gold filigree and a small radiant amethyst. Each icon must visibly read as a dagger, not a sword or knife; varied silhouettes and ornament by tier. Place exactly one weapon per occupied cell, fully inside generous transparent padding, centered. Match handcrafted richly shaded 32-bit pixel art, chunky square pixels, dark plum outlines, crisp highlights, jewel colors, no text, letters, labels, numbers, extra objects, shadows outside icon silhouettes, watermarks, photorealism, vector lines, smoothing, or 3D.”

### factions-v2.png

5 columns × 5 rows: five class crests, five class abilities, nine set emblems and six rune stones.

Prompt: “Create a perfectly square, transparent 5-column by 5-row sprite sheet with exactly 25 distinct centered icons. Row 1: five class crests. Row 2: the five matching class abilities. Row 3: crimson, glacier, storm, life and oracle set emblems. Row 4: hunter, arcane, shadow and sanctum set emblems, followed by a ruby rune. Row 5: emerald, sapphire, topaz, amethyst and onyx runes. Match the supplied vivid, richly shaded pixel-art style with dark plum outlines and upper-left highlights. Keep every icon centered inside its own equal square cell with clear transparent margins; no text, labels, grid lines, panels, overlap or watermark.”

### collection-v2.png

6 columns × 6 rows: eight companion portraits, egg, five distinct elixir icons, random-elixir reward, six achievement emblems, tower key, emerald currency, class seal and unlock crest, daily/weekly/monthly quest emblems, menu icons, four companion-rarity badges and a quest-bonus seal.

Prompt: “Generate a perfectly square, transparent 6-column by 6-row sprite sheet with exactly 36 distinct centered pixel-fantasy icons. Row 1: wolf pup, golden beetle, owl, forest fairy, stone golem, sparrow. Row 2: shadow wolf, baby dragon, jeweled egg, swift elixir, precision elixir, vampire elixir. Row 3: healing elixir, shadow elixir, random elixir reward, set collector achievement, multi-set collector achievement, tower achievement. Row 4: companion achievement, rune achievement, daily quest achievement, tower key, emerald premium currency, tower seal. Row 5: class unlock crest, daily quest emblem, weekly quest emblem, monthly calendar emblem, tower menu icon, class menu crest. Row 6: companion menu icon, common/rare/epic/legendary companion rarity badges, quest bonus seal. Use crisp richly shaded 32-bit pixel art, dark plum outlines, square pixels and readable jewel highlights. Each icon occupies only the center of its own equal square cell with broad transparent margins; no text, labels, grid lines, panels, touching or overlap.”

## Prompt set

Shared production specification:

Production sprite atlas for a 2D pixel fantasy idle RPG. Strict equal edge-to-edge cell grid. Transparent background around every object. No grid lines, panels, tile backgrounds, text, numbers, labels, watermarks, or outer margins. One centered icon in each cell with empty padding, no overlap. Crisp handcrafted 32-bit pixel art, chunky square pixels, dark plum-black outlines, upper-left highlights, restrained four-tone ramps. Jewel greens/purples, warm antique gold, steel blue, brown leather, crimson flames. Readable at 24–32 px; no photorealistic, vector, smoothed or 3D rendering.

### weapons-v1.png

5 columns × 7 rows. Strict left-to-right subject order; each following line is one row. Progression changes silhouettes and ornament, not only color.

1. rusty sword, wood chopping axe, wooden mallet, sharpened wooden staff/spear, rusty dagger
2. iron sword, iron axe, iron mace, iron spear, iron dagger
3. polished steel sword, battle axe, war hammer, cavalry lance, assassin dagger
4. blue glowing rune sword, rune axe, rune hammer, rune spear, rune dagger
5. cyan mithril sword, mithril axe, mithril hammer, mithril spear, mithril dagger
6. dragon fang sword, dragon axe, dragon hammer, dragon spear, dragon claw dagger with red/orange bone and scale motifs
7. celestial violet/gold star sword, star axe, star hammer, star spear, star dagger

### equipment-v1.png

9 columns × 7 rows. Strict left-to-right subject order; each following line is one row. Progression changes silhouettes and ornament, not only color.

1. leather cap, cloth shirt, sandals, copper ring, wooden talisman, ragged cape, wooden shield, cloth gloves, rope belt
2. iron helmet, leather armor, leather boots, silver ring, bone necklace, traveler cloak, iron shield, leather gloves, leather belt
3. steel helmet, chainmail, iron boots, gold ring, silver necklace, hunter cloak, tower shield, chain gloves, studded belt
4. knight helmet, plate armor, traveler boots, ruby ring, emerald necklace, shadow cloak, rune shield, iron gauntlets, warrior belt
5. mithril crown, mithril armor, wind boots, diamond ring, soul necklace, royal cape, mithril shield, rune gloves, champion belt
6. dragon helmet, dragon scale armor, dragon boots, ancient ring, ancient amulet, phoenix cape, dragon shield, dragon claws, ancient belt
7. celestial star crown, star armor, star boots, star signet, star heart necklace, star cape, star shield, star gloves, star belt

### powers-v1.png

8 columns × 6 rows. Strict left-to-right subject order; each following line is one row. Progression changes silhouettes and ornament, not only color.

1. Power Strike: sword smashing a yellow explosive impact; Frenzy: flaming crimson berserker fist; Gold Rush: rain of golden coins from a cloud; Divine Heal: emerald heart with angel wings and holy light; Apocalypse Meteor: burning orange meteor descending diagonally; Combat branch: crossed red swords; Survival branch: emerald shield and oak leaves; Wealth branch: gold overflowing coin pouch
2. Gear branch: adventurer backpack with weapon straps; Arcane branch: purple wizard tome and crystal; Power upgrade: mighty steel blade with upward red aura; Vitality upgrade: red heart inside iron frame; Defense upgrade: steel shield with blue rivets; Regeneration upgrade: green heart wrapped in healing vines; Haste upgrade: silver winged boot with speed trails; Precision upgrade: golden eye with bullseye pupil
3. Brutality upgrade: cracked red skull and impact shards; Greed upgrade: claw grasping gold coins; Fortune upgrade: jade four leaf clover with small sparkles; Vampirism upgrade: crimson blood drop between fangs; Giant Slayer upgrade: greatsword piercing giant crown; Evasion upgrade: hooded shadow vanishing in emerald smoke; Sharp Sword soul node: sharpened blade on whetstone; Deadly Focus soul node: single red focused eye in violet crystal
4. Boss Hunter soul node: broken crown on sword tip; Borrowed Time soul node: gold hourglass with blue sand; Savage Might soul node: roaring red wolf head; Iron Body soul node: armored red heart; Shield Bearer soul node: tower shield with gold handle; Escape Master soul node: footprint dissolving into leaves; Divine Healing soul node: radiant green chalice and cross-shaped sparkle; Thorn Armor soul node: steel chest armor covered in green thorns
5. Gold Scent soul node: gold coin with flowing golden scent trail; Soul Harvest soul node: spectral purple soul over sickle; Gold Legacy soul node: ancient locked gold vault; Fast Start soul node: winged trail marker with sunrise; Bargainer soul node: handshake and coin; Wide Bag soul node: expanded leather satchel with extra pouches; Glove Mastery soul node: raised enchanted gauntlet; Belt Buckle soul node: ornate glowing square bronze buckle
6. Traveler Cape soul node: green hooded cape and compass; Double Loot soul node: two gift sacks with emerald gems; Magic Flow soul node: spiraling purple rune vortex; Golden Rain soul node: gold cloud with falling coin streams; Spell Power soul node: violet crystal orb grasped by a claw; Battle Call soul node: curved bronze war horn with crimson ribbon; Meteor Mastery soul node: molten meteor inside ancient purple rune circle; Thorns stat: green spiked bramble wrapping a metal spike

### interface-v1.png

8 columns × 8 rows. Strict left-to-right subject order; each following line is one row. Progression changes silhouettes and ornament, not only color.

1. Character menu: small heroic adventurer bust wearing leather armor; Upgrades menu: upward golden chevrons behind a steel blade; Skills menu: open violet spellbook with glowing rune; Forge menu: blacksmith hammer striking anvil; Shop menu: medieval merchant stall with burgundy awning; Achievements menu: golden trophy with laurel; Soul Tree menu: magical emerald tree with purple roots; Settings menu: antique bronze gear with central blue gem
2. Currency: stack of gold coins; Soul currency: friendly lavender wisp with glowing eyes; Health: crimson heart; Save: parchment scroll with wax seal and quill; Lock: closed bronze padlock; Equip Best: lightning bolt behind armor; Statistics: parchment chart with three gold bars; Inventory: sturdy leather backpack
3. Hunter achievement: sword over defeated beast skull medallion; Explorer achievement: rolled map with compass medallion; Boss Hunter achievement: crowned horned skull medallion; Elite Hunter achievement: silver star with red gem medallion; Rich achievement: gold overflowing treasury medallion; Collector achievement: backpack filled with gems medallion; Legend Seeker achievement: golden radiant legendary gem medallion; Blacksmith achievement: hammer and anvil medallion
4. Mage achievement: violet wizard hat with star medallion; Reborn achievement: spectral phoenix medallion; Mythic Hunter achievement: crimson crystal in ornate gold medallion; Full Equipment achievement: full suit of plate armor medallion; Weapon Master achievement: crossed axe and sword medallion; Elite Expert achievement: six small elemental gems around eye medallion; Monster Scholar achievement: open bestiary with tiny creature head medallion; One Hit achievement: fist shattering stone medallion
5. Fast Executioner achievement: hourglass crossed by sword medallion; Shadow achievement: dark hood and emerald leaf medallion; Loyal Adventurer achievement: camp lantern and hourglass medallion; Soul Gardener achievement: glowing bonsai spirit tree medallion; Growth achievement: ascending three gold chevrons medallion; Wooden chest with iron latch; Heavy iron treasure chest with blue gem lock; Royal golden treasure chest with purple gem lock
6. Health potion: round red glass flask with cork; Wrath elixir: angular crimson flask with fire motif; Ironskin elixir: steel-gray reinforced flask with shield seal; Gold elixir: round golden honey flask with coin seal; Luck scroll: parchment with jade rune and green ribbon; Gift: tied treasure sack with ribbon; Game controls: medieval styled little gamepad; Keyboard: small brass keyboard
7. Refresh: two curved teal arrows; Sort: three stacked items with brass arrow; Automatic: circular rune gear surrounding play triangle; Combat status: crossed steel swords; Boss status: gold horned crown; Information: blue crystal with white i symbol; Audio: small gold bell; Warning: red triangular rune with exclamation mark
8. Export: parchment with outward arrow; Import: parchment with inward arrow; Reset: cracked hourglass with circular red arrow; Confirm: emerald check mark; Close: red diagonal cross; Expand menu: downward brass chevron; Collapse menu: upward brass chevron; Linked prerequisite: two linked silver chain rings

