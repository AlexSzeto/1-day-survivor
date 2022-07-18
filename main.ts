namespace SpriteKind {
    export const NonInteractive = SpriteKind.create()
    export const VisualEffects = SpriteKind.create()

    export const Orbital = SpriteKind.create()
    export const Molotov = SpriteKind.create()
    export const Flame = SpriteKind.create()
    export const Explosive = SpriteKind.create()

    export const PickUp = SpriteKind.create()
    export const Treasure = SpriteKind.create()

    export const UI = SpriteKind.create()
}

namespace StatusBarKind {
    export const Experience = StatusBarKind.create()
}

/*
TESTING
*/
const CHEAT_MODE = false

/*
PERFORMANCE CONSTANTS
*/
const MAX_DROPS = 8
const MAX_FOOD = 1
const MAX_ENEMIES = 6
const DEFAULT_WEAPON_LIFESPAN = 800
const GEM_FLY_SPEED = 100

/*
BALANCE CONSTANTS
*/
const ENEMY_DAMAGE_SCALE = 0.15
const ENEMY_HEALTH_SCALE = 0.15
const ENEMY_SPEED_SCALE = 0.15
const ENEMY_MAX_SPEED = 90
const ENEMY_TURN_RATE = 100
const HEAL_DROP_CHANCE = 5
const SPRAY_ANGLE_DELTA = 120 / 5
const HERO_UPGRADE_CHOICES = 3

const ENEMY_KNOCKBACK_FRICTION = 15
const WEAPON_KNOCKBACK_VELOCITY = 30

const HYPER_PHASE_TICKS = 50
const HYPER_XP_MULTIPLIER = 1.5
const HYPER_BOSS_HP_SCALE = 0.5
const HYPER_ENEMY_SPEED_SCALE = 1.2

/*
GFX CONSTANTS
*/
const Z_FLAME = 10
const Z_PICKUP = 11
const Z_TREASURE_FOOD = 12
const Z_NPC = 13
const Z_ENEMY = 14
const Z_DODGE_SHADOW = 15
const Z_PROJECTILE = 16
const Z_HERO = 17
const Z_AURA = 18
const Z_EXPLOSION = 19
const Z_UI = 20

const MAX_UPGRADES = 6

const zombie_flash = assets.image`zombie`.clone()
const knight_flash = assets.image`knight`.clone()
const lava_zombie_flash = assets.image`lava-zombie`.clone()
const captain_flash = assets.image`captain`.clone()
const skeleton_mage_flash = assets.image`skeleton-mage`.clone()
const slime_flash = assets.image`slime`.clone()
const tough_slime_flash = assets.image`tough-slime`.clone()
const slime_king_flash = assets.image`slime-king`.clone()
const mummy_flash = assets.image`mummy`.clone()
const troll_flash = assets.image`troll`.clone()
const ghost_flash = assets.image`ghost`.clone()
const mean_spirit_flash = assets.image`mourner`.clone()

custom.color_shift_white(zombie_flash)
custom.color_shift_white(knight_flash)
custom.color_shift_white(lava_zombie_flash)
custom.color_shift_white(captain_flash)
custom.color_shift_white(skeleton_mage_flash)
custom.color_shift_white(slime_flash)
custom.color_shift_white(tough_slime_flash)
custom.color_shift_white(slime_king_flash)
custom.color_shift_white(mummy_flash)
custom.color_shift_white(troll_flash)
custom.color_shift_white(ghost_flash)
custom.color_shift_white(mean_spirit_flash)

/*
GLOBALS
*/

let hyper_mode = false

type TickTracking = {
    rate: number,
    count: number,
    event: () => void
}

let tick_trackers:TickTracking[] = []
function start_tick_track(event: () => void, rate: number = 0): TickTracking {
    const new_tick = {
        rate,
        count: 0,
        event
    }
    tick_trackers.push(new_tick)
    return new_tick
}

function fire_on_next_tick(tick:TickTracking) {
    tick.count = tick.rate
}

let molotov_spawn_count = 0
let molotov_spawn_tick:TickTracking = start_tick_track(spawn_molotov)
let molotov_aoe_tick: TickTracking = start_tick_track(molotov_aoe)
let molotov_duration_max = 0
let molotov_duration_min = 0
let molotov_damage = 0
let molotov_speed = 0
let molotov_tick_damage = 0
let molotov_flame_duration = 0
let molotov_flame_scale = 0

let aura_spawn_count = 0
let aura_aoe_tick: TickTracking = start_tick_track(aura_aoe)
let aura_tick_damage = 0
let aura_scale = 0
let aura_tick_pushback = 0

let orbit_spawn_count = 0
let orbit_spawn_tick: TickTracking = start_tick_track(spawn_orbit)
let orbit_damage = 0
let orbit_refresh_rate = 0
let orbit_duration = 0
let orbit_distance = 0
let orbit_angular_speed = 0

let explosive_spawn_count = 0
let exploder_spawn_tick: TickTracking = start_tick_track(spawn_explosive)
let exploder_projectile_damage = 0
let exploder_speed = 0
let exploder_explosion_damage = 0
let exploder_explosion_scale = 0
let exploder_duration = 0

let tracer_spawn_count = 0
let tracer_spawn_tick: TickTracking = start_tick_track(spawn_tracer)
let tracer_damage = 0
let tracer_speed = 0

let spray_spawn_count = 0
let spray_spawn_tick: TickTracking = start_tick_track(spawn_spray)
let spray_damage = 0
let spray_speed = 0
let spray_inaccuracy = 30

let bonus_magic_spawn = 0

type StatTracking = {
    name: string
    total: number
    icon: Image
    label?: string
}

let damage_tracker:StatTracking[] = [
    {
        name: "CROSS",
        total: 0,
        icon: assets.image`icon-cross`
    },
    {
        name: "SPARK",
        total: 0,
        icon: assets.image`icon-spark`
    },
    {
        name: "FIREBALL",
        total: 0,
        icon: assets.image`icon-fireball`
    },
    {
        name: "DIVINE AURA",
        total: 0,
        icon: assets.image`icon-aura`
    },
    {
        name: "SPELLBOOK",
        total: 0,
        icon: assets.image`icon-book`
    },
    {
        name: "HOLY WATER",
        total: 0,
        icon: assets.image`icon-water`
    },
    {
        name: "BLESSED CUP",
        total: 0,
        icon: assets.image`icon-cup`
    },
    {
        name: "GEM PRISM",
        total: 0,
        icon: assets.image`icon-prism`
    },
    {
        name: "LIFE SHIELD",
        total: 0,
        icon: assets.image`icon-shield`
    },
    {
        name: "AURA RING",
        total: 0,
        icon: assets.image`icon-ring`
    },
    {
        name: "POWER CRYSTAL",
        total: 0,
        icon: assets.image`icon-crystal`
    },
    {
        name: "MAGIC FLASK",
        total: 0,
        icon: assets.image`icon-flask`
    },
    {
        name: "FAIRY FEATHER",
        total: 0,
        icon: assets.image`icon-wing`
    }
]

function make_enemy_stat(): StatTracking[] {
    return [
        {
            name: "ZOMBIE",
            total: 0,
            icon: assets.image`icon-zombie`
        },
        {
            name: "KNIGHT",
            total: 0,
            icon: assets.image`icon-knight`
        },
        {
            name: "MUMMY",
            total: 0,
            icon: assets.image`icon-mummy`
        },
        {
            name: "SLIME",
            total: 0,
            icon: assets.image`icon-slime`
        },
        {
            name: "TOUGH SLIME",
            total: 0,
            icon: assets.image`icon-tough-slime`
        },
        {
            name: "GHOST",
            total: 0,
            icon: assets.image`icon-ghost`
        },
        {
            name: "LAVA ZOMBIE",
            total: 0,
            icon: assets.image`icon-lava-zombie`
        },
        {
            name: "MEAN SPIRIT",
            total: 0,
            icon: assets.image`icon-mourner`
        },
        {
            name: "CAPTAIN",
            total: 0,
            icon: assets.image`icon-captain`
        },
        {
            name: "SKELETON MAGE",
            total: 0,
            icon: assets.image`icon-skeleton-mage`
        },
        {
            name: "SLIME KING",
            total: 0,
            icon: assets.image`icon-slime-king`
        },
        {
            name: "TROLL",
            total: 0,
            icon: assets.image`icon-troll`
        }
    ]
}

let kill_tracker:StatTracking[] = make_enemy_stat()
let wound_tracker: StatTracking[] = make_enemy_stat()

let enemy_attack_cooldown_tick: TickTracking = start_tick_track(reset_enemy_attack_cooldown)
enemy_attack_cooldown_tick.rate = 3
let enemy_spawn_tick: TickTracking = start_tick_track(spawn_enemy_wave, 4)
let enemy_phase_tick: TickTracking = start_tick_track(next_enemy_phase, 100)
let enemy_phase = 0
let enemy_extra_difficulty = 0

let hero: Sprite = null
let hero_health: StatusBarSprite = null
let hero_xp: StatusBarSprite = null
let hero_xp_increment: number = 0
let hero_speed = 100
let hero_regen = 0
let hero_regen_tick: TickTracking = start_tick_track(regenerate_hero, 4)
let hero_auto_collect_tick: TickTracking = null
let hero_level = 1
let hero_angle = 0
let hero_dodge = 0
let hero_dodge_distance = 8
let hero_dodge_speed = 150
let hero_dodge_heal = 0
let hero_auto_collect_chance: number = 0
let hero_gem_collect_radius: number = 24
let hero_food_heal = 30

type HeroBuild = {
    prerequsites: string[]
    strongest_weapon: string
    name: string
    color: number
}
let hero_builds:HeroBuild[] = []

let gem_bonus_xp = 0
let weapon_knockback = 0
let aura_weapon: Sprite = null
let upgrade_menu: miniMenu.MenuSprite = null
let upgrade_ui: Image = image.create((assets.image`icon-spark`.width + 2) * MAX_UPGRADES, assets.image`icon-spark`.height)
let upgrade_ui_sprite: Sprite = null

let cat_inside_chest = false
let cat_out_of_chest = false

if(CHEAT_MODE) {
    hero_dodge = 100
    hero_auto_collect_chance = 100
}

/*
MAIN MENU
*/

let main_menu: miniMenu.MenuSprite = null
let seen_intro: boolean = settings.readNumber("seen_intro") == 1
let completed_game: boolean = settings.readNumber("completed_game") == 1

const menu_image = assets.image`castle-background`.clone()
let hero_foreground: Sprite = null
let title_text: Sprite = null

function start_main_menu() {

    if(main_menu) {
        main_menu.close()
        title_text.destroy()
        hero_foreground.destroy()
        main_menu = null
    }

    scene.setBackgroundImage(menu_image)
    menu_image.drawImage(assets.image`castle-background`.clone(), 0, 0)
    title_text = sprites.create(assets.image`title-text`, SpriteKind.NonInteractive)
    title_text.left = 0
    title_text.top = 12
    title_text.vy = -24
    title_text.fy = 24
    hero_foreground = sprites.create(assets.image`hero-foreground`, SpriteKind.NonInteractive)
    hero_foreground.right = scene.screenWidth()
    hero_foreground.top = 8
    hero_foreground.vy = -16
    hero_foreground.fy = 16
    game.setDialogFrame(assets.image`dialog-frame`)
    if (completed_game) {
        main_menu = miniMenu.createMenu(
            miniMenu.createMenuItem("START   "),
            miniMenu.createMenuItem("HYPER MODE   "),
            miniMenu.createMenuItem("THE STORY   "),
            miniMenu.createMenuItem("HOW TO PLAY   ")
        )
    } else {
        main_menu = miniMenu.createMenu(
            miniMenu.createMenuItem("START   "),
            miniMenu.createMenuItem("THE STORY   "),
            miniMenu.createMenuItem("HOW TO PLAY   ")
        )
    }
    main_menu.z = Z_UI
    main_menu.setFrame(assets.image`dialog-frame`)
    const menu_height = 16 + 12 * 3
    main_menu.setMenuStyleProperty(miniMenu.MenuStyleProperty.Height, menu_height)
    main_menu.setMenuStyleProperty(miniMenu.MenuStyleProperty.Width, main_menu.width + 12)
    main_menu.setStyleProperty(miniMenu.StyleKind.Default, miniMenu.StyleProperty.Padding, 2)
    main_menu.setStyleProperty(miniMenu.StyleKind.DefaultAndSelected, miniMenu.StyleProperty.Alignment, miniMenu.Alignment.Center)
    main_menu.setStyleProperty(miniMenu.StyleKind.Selected, miniMenu.StyleProperty.Background, 12)
    main_menu.left = (scene.screenWidth() - main_menu.width) / 2
    main_menu.bottom = scene.screenHeight() - 10

    main_menu.onButtonPressed(controller.A, function (selection, selectedIndex) {
        main_menu.close()
        title_text.destroy()
        hero_foreground.destroy()
        main_menu = null
        switch(selection) {
            case "HYPER MODE   ":
                hyper_mode = true
                enemy_phase_tick.rate = HYPER_PHASE_TICKS
            case "START   ":
                if (!seen_intro) {
                    menu_image.drawTransparentImage(assets.image`hero-foreground`, menu_image.width - assets.image`hero-foreground`.width, 0)
                    show_intro()
                    show_instructions()
                }
                scene.setBackgroundColor(12)
                setup_game()
                choose_upgrade("STARTING WEAPON")
                break
            case "THE STORY   ":
                menu_image.drawTransparentImage(assets.image`hero-foreground`, menu_image.width - assets.image`hero-foreground`.width, 0)
                show_intro()
                start_main_menu()
                break
            case "HOW TO PLAY   ":
                show_instructions()
                start_main_menu()
                break
        }
    })
}

function show_instructions() {
    game.showLongText("INSTRUCTIONS\n \nMove to avoid monsters.\n \nLet your weapons auto attack.\n \nCollect gems from monsters to level up and survive!", DialogLayout.Full)        
}

function show_intro() {
    game.showLongText(
        "You are Sophie, the brave knight!\n" +
        "An ancient evil haunts the castle.\n" +
        "Save the kingdom from the mosters.\n" +
        "Enter the castle and lift its curse!", DialogLayout.Bottom)
    seen_intro = true
    settings.writeNumber("seen_intro", 1)
}

controller.left.onEvent(ControllerButtonEvent.Pressed, () => { hero_angle = 180 })
controller.right.onEvent(ControllerButtonEvent.Pressed, () => { hero_angle = 0 })
controller.up.onEvent(ControllerButtonEvent.Pressed, () => { hero_angle = 270 })
controller.down.onEvent(ControllerButtonEvent.Pressed, () => { hero_angle = 90 })

/*
UPGRADES
*/

function get_random_upgrade (include_basic_items:boolean, message: string) {
    let upgrade_list = custom.get_upgrade_choices(1, include_basic_items)
    if (upgrade_list.length > 0) {
        let next_upgrade = upgrade_list.pop()
        if(message.length > 0) {
            game.showLongText(message, DialogLayout.Bottom)
            game.showLongText(next_upgrade, DialogLayout.Bottom)
        }
        if(hero) {
            perform_upgrade(custom.get_upgrade(next_upgrade))
        } else {
            custom.get_upgrade(next_upgrade)
        }
    } else {
        game.showLongText("You found gold coins!", DialogLayout.Bottom)
        info.changeScoreBy(100)
    }
}

function choose_upgrade(title: string) {
    let upgrade_list = custom.get_upgrade_choices(HERO_UPGRADE_CHOICES, true)
    if (upgrade_list.length > 0) {
        pause_the_game()
        effects.confetti.startScreenEffect()
        upgrade_menu = miniMenu.createMenuFromArray(custom.convert_string_array_to_mini_menu_items(upgrade_list))
        upgrade_menu.z = Z_UI
        upgrade_menu.setTitle(title)
        upgrade_menu.setMenuStyleProperty(miniMenu.MenuStyleProperty.Width, scene.screenWidth() - 20)
        upgrade_menu.setFrame(assets.image`dialog-frame`)
        upgrade_menu.setMenuStyleProperty(miniMenu.MenuStyleProperty.Height, 32 + 14 * upgrade_list.length)
        upgrade_menu.setStyleProperty(miniMenu.StyleKind.Default, miniMenu.StyleProperty.Padding, 2)
        upgrade_menu.setStyleProperty(miniMenu.StyleKind.Selected, miniMenu.StyleProperty.Background, 12)
        upgrade_menu.setStyleProperty(miniMenu.StyleKind.Title, miniMenu.StyleProperty.Padding, 4)
        custom.move_sprite_on_top_of_another(upgrade_menu, hero)
        upgrade_menu.onButtonPressed(controller.A, function (selection, selectedIndex) {
            upgrade_menu.close()
            effects.confetti.endScreenEffect()
            let next_upgrade = custom.get_upgrade(selection)
            perform_upgrade(next_upgrade)
            unpause_the_game()
        })
    } else {
        if(!CHEAT_MODE) {
            game.showLongText(
                "You reached\n" +
                "level " + hero_level + "!\n" +
                "You feel slightly tougher.", DialogLayout.Bottom)
            hero_health.max += 5
            hero_health.value += 5
        }
    }
}

// CONTAINS GAME DESIGN

function add_build(name: string, color: number, prerequsites: string[] = null, strongest_weapon: string = null) {
    hero_builds.push({
        name,
        color,
        prerequsites,
        strongest_weapon
    })
}

function setup_upgrade_menu() {
    custom.add_upgrade_to_list("CROSS", assets.image`icon-cross`, "throw 3 crosses", "WEAPON")
    spray_spawn_count = 0
    spray_speed = 100
    spray_spawn_tick.rate = 6
    spray_damage = 12 // 12-24
    custom.add_upgrade_to_list("CROSS 2", assets.image`icon-cross`, "+1 cross", "CROSS") // 12-36
    custom.add_upgrade_to_list("CROSS 3", assets.image`icon-cross`, "x1.5 damage", "CROSS 2") // 18-54
    custom.add_upgrade_to_list("CROSS 4", assets.image`icon-cross`, "+1 cross", "CROSS 3") // 18-72
    custom.add_upgrade_to_list("CROSS 5", assets.image`icon-cross`, "x2 damage", "CROSS 4") // 36-144

    custom.add_upgrade_to_list("SPARK", assets.image`icon-spark`, "auto aim missile", "WEAPON")
    tracer_spawn_count = 0
    tracer_speed = 90
    tracer_spawn_tick.rate = 8
    tracer_damage = 12
    custom.add_upgrade_to_list("SPARK 2", assets.image`icon-spark`, "x1.5 damage", "SPARK") // 18 * .75
    custom.add_upgrade_to_list("SPARK 3", assets.image`icon-spark`, "x1.25 attack speed", "SPARK 2") // 18
    custom.add_upgrade_to_list("SPARK 4", assets.image`icon-spark`, "x2 damage", "SPARK 3") // 36
    custom.add_upgrade_to_list("SPARK 5", assets.image`icon-spark`, "+1 spark", "SPARK 4") // 36-72

    custom.add_upgrade_to_list("FIREBALL", assets.image`icon-fireball`, "explode on impact", "WEAPON")
    explosive_spawn_count = 0
    exploder_speed = 80
    exploder_duration = 750
    exploder_spawn_tick.rate = 10
    exploder_projectile_damage = 0
    exploder_explosion_damage = 30
    exploder_explosion_scale = 1.0
    custom.add_upgrade_to_list("FIREBALL 2", assets.image`icon-fireball`, "x2 damage", "FIREBALL") // 60 *.6
    custom.add_upgrade_to_list("FIREBALL 3", assets.image`icon-fireball`, "x1.5 radius", "FIREBALL 2") // 60 *.6
    custom.add_upgrade_to_list("FIREBALL 4", assets.image`icon-fireball`, "x1.5 speed", "FIREBALL 3") // 60 *.6
    custom.add_upgrade_to_list("FIREBALL 5", assets.image`icon-fireball`, "x2 damage", "FIREBALL 4") // 120 *.6

    custom.add_upgrade_to_list("SPELLBOOK", assets.image`icon-book`, "circles to protect", "WEAPON")
    orbit_spawn_count = 0
    orbit_spawn_tick.rate = 18
    orbit_angular_speed = 6
    orbit_distance = 30
    orbit_duration = 3000
    orbit_damage = 20 // 12
    custom.add_upgrade_to_list("SPELLBOOK 2", assets.image`icon-book`, "+1 book", "SPELLBOOK") // 20-40 *.33 (36)
    custom.add_upgrade_to_list("SPELLBOOK 3", assets.image`icon-book`, "x1.5 damage", "SPELLBOOK 2") // 30-60 *.33 (54)
    custom.add_upgrade_to_list("SPELLBOOK 4", assets.image`icon-book`, "+1 book", "SPELLBOOK 3") // 30-90 (54)
    custom.add_upgrade_to_list("SPELLBOOK 5", assets.image`icon-book`, "x1.5 damage", "SPELLBOOK 4") // 45-135 *.33 (90)

    custom.add_upgrade_to_list("DIVINE AURA", assets.image`icon-aura`, "damage ring", "WEAPON")
    aura_spawn_count = 0
    aura_aoe_tick.rate = 2
    aura_tick_damage = 8
    aura_scale = 1.0
    custom.add_upgrade_to_list("DIVINE AURA 2", assets.image`icon-aura`, "x1.2 radius", "DIVINE AURA") // 8 * 3
    custom.add_upgrade_to_list("DIVINE AURA 3", assets.image`icon-aura`, "x1.5 damage", "DIVINE AURA 2") // 12 * 3
    custom.add_upgrade_to_list("DIVINE AURA 4", assets.image`icon-aura`, "x1.2 radius", "DIVINE AURA 3") // 12 * 3
    custom.add_upgrade_to_list("DIVINE AURA 5", assets.image`icon-aura`, "x2 damage", "DIVINE AURA 4") // 24 * 3

    custom.add_upgrade_to_list("HOLY WATER", assets.image`icon-water`, "toss and burn", "WEAPON")
    molotov_spawn_count = 0
    molotov_speed = 85
    molotov_damage = 12
    molotov_duration_min = 300
    molotov_duration_max = 700
    molotov_flame_duration = 4000 // 4 ticks, assuming 3s to reposition
    molotov_spawn_tick.rate = 24 // 6 sec
    molotov_aoe_tick.rate = 2 // 2 attacks
    molotov_tick_damage = 8 // 16
    molotov_flame_scale = 1.0 
    custom.add_upgrade_to_list("HOLY WATER 2", assets.image`icon-water`, "x1.5 duration", "HOLY WATER") // 
    custom.add_upgrade_to_list("HOLY WATER 3", assets.image`icon-water`, "x1.5 radius", "HOLY WATER 2") //
    custom.add_upgrade_to_list("HOLY WATER 4", assets.image`icon-water`, "x2 damage", "HOLY WATER 3") // 
    custom.add_upgrade_to_list("HOLY WATER 5", assets.image`icon-water`, "x2 intensity", "HOLY WATER 4") // 

    custom.add_upgrade_to_list("LIFE SHIELD", assets.image`icon-shield`, "x2 item healing", "ACCESSORY")
    custom.add_upgrade_to_list("LIFE SHIELD 2", assets.image`icon-shield`, "x1.5 max HP", "LIFE SHIELD")
    custom.add_upgrade_to_list("LIFE SHIELD 3", assets.image`icon-shield`, "+4 HP per second", "LIFE SHIELD 2")

    custom.add_upgrade_to_list("GEM PRISM", assets.image`icon-prism`, "x1.5 pickup range", "ACCESSORY")
    custom.add_upgrade_to_list("GEM PRISM 2", assets.image`icon-prism`, "absorb gems every 10s", "GEM PRISM")
    custom.add_upgrade_to_list("GEM PRISM 3", assets.image`icon-prism`, "+1 XP per gem", "GEM PRISM 2")

    custom.add_upgrade_to_list("FAIRY FEATHER", assets.image`icon-wing`, "x1.1 move and dodge", "ACCESSORY")
    custom.add_upgrade_to_list("FAIRY FEATHER 2", assets.image`icon-wing`, "x1.2 move and dodge", "FAIRY FEATHER")
    custom.add_upgrade_to_list("FAIRY FEATHER 3", assets.image`icon-wing`, "+15 HP on dodge", "FAIRY FEATHER 2")

    custom.add_upgrade_to_list("MAGIC FLASK", assets.image`icon-flask`, "x1.1 all attack speed", "ACCESSORY")
    custom.add_upgrade_to_list("MAGIC FLASK 2", assets.image`icon-flask`, "x1.2 all attack speed", "MAGIC FLASK")
    custom.add_upgrade_to_list("MAGIC FLASK 3", assets.image`icon-flask`, "+1 spell weapons", "MAGIC FLASK 2")
    // spellbook, spark, fireball

    custom.add_upgrade_to_list("POWER CRYSTAL", assets.image`icon-crystal`, "x1.1 all damage", "ACCESSORY")
    custom.add_upgrade_to_list("POWER CRYSTAL 2", assets.image`icon-crystal`, "x1.2 all damage", "POWER CRYSTAL")
    custom.add_upgrade_to_list("POWER CRYSTAL 3", assets.image`icon-crystal`, "+weapon knockback", "POWER CRYSTAL 2")
    // cross, spark, spellbook

    custom.add_upgrade_to_list("AURA RING", assets.image`icon-ring`, "x1.2 all radius", "ACCESSORY")
    custom.add_upgrade_to_list("AURA RING 2", assets.image`icon-ring`, "x1.2 all radius", "AURA RING")
    custom.add_upgrade_to_list("AURA RING 3", assets.image`icon-ring`, "x2 radius damage", "AURA RING 2")
    // holy water, fireball, divine aura

    custom.add_upgrade_to_list("BLESSED CUP", assets.image`icon-cup`, "+2 HP per second", "ACCESSORY")
    custom.add_upgrade_to_list("BLESSED CUP 2", assets.image`icon-cup`, "x1.1 holy damage", "BLESSED CUP")
    custom.add_upgrade_to_list("BLESSED CUP 3", assets.image`icon-cup`, "+holy powers ups", "BLESSED CUP 2")
    // holy water, cross, divine aura

    add_build("GRAND SORCERESS", 10, ["SPELLBOOK", "SPARK", "FIREBALL", "MAGIC FLASK 3"])
    add_build("SORCERESS", 8, ["SPELLBOOK", "SPARK", "FIREBALL"])
    add_build("CRYSTAL TRICKSTER", 10, ["CROSS", "SPARK", "SPELLBOOK", "POWER CRYSTAL 3"])
    add_build("TRICKSTER", 8, ["CROSS", "SPARK", "SPELLBOOK"])
    add_build("AURA MASTER", 10, ["HOLY WATER", "FIREBALL", "DIVINE AURA", "AURA RING 3"])
    add_build("AURAMANCER", 8, ["HOLY WATER", "FIREBALL", "DIVINE AURA"])
    add_build("BLESSED PALADIN", 10, ["HOLY WATER", "CROSS", "DIVINE AURA", "BLESSED CUP 3"])
    add_build("PALADIN", 8, ["HOLY WATER", "CROSS", "DIVINE AURA"])

    add_build("ULTIMATE SURVIVOR", 10, ["LIFE SHIELD 3", "FAIRY FEATHER 3", "GEM PRISM 3"])
    add_build("SURVIVOR", 8, ["LIFE SHIELD", "FAIRY FEATHER", "GEM PRISM"])

    add_build("MAGICIAN", 7, [], "SPARK 5")
    add_build("APPRENTICE", 15, [], "SPARK")
    add_build("VETERAN", 7, [], "CROSS 5")
    add_build("SOLDIER", 15, [], "CROSS")
    add_build("PYROMANCER", 7, [], "FIREBALL 5")
    add_build("FIRESTARTER", 15, [], "FIREBALL")
    add_build("ORACLE", 7, [], "DIVINE AURA 5")
    add_build("PRIESTESS", 15, [], "DIVINE AURA")
    add_build("CHEMIST", 7, [], "HOLY WATER 5")
    add_build("ALCHEMIST", 15, [], "HOLY WATER")
    add_build("SAGE", 7, [], "SPELLBOOK 5")
    add_build("SCHOLAR", 15, [], "SPELLBOOK")
}

// CONTAINS GAME DESIGN
function perform_upgrade(name: string) {
    switch(name) {
        case "LIFE SHIELD":
            hero_food_heal *= 2
            break
        case "LIFE SHIELD 2":
            hero_health.max *= 1.5
            break
        case "LIFE SHIELD 3":
            hero_regen += 4
            break

        case "MAGIC FLASK":
            spray_spawn_tick.rate *= 0.9
            tracer_spawn_tick.rate *= 0.9
            exploder_spawn_tick.rate *= 0.9
            orbit_spawn_tick.rate *= 0.9
            molotov_spawn_tick.rate *= 0.9
            break
        case "MAGIC FLASK 2":
            spray_spawn_tick.rate *= 0.8
            tracer_spawn_tick.rate *= 0.8
            exploder_spawn_tick.rate *= 0.8
            orbit_spawn_tick.rate *= 0.8
            molotov_spawn_tick.rate *= 0.8
            break
        case "MAGIC FLASK 3":
            bonus_magic_spawn = 1
            break

        case "POWER CRYSTAL":
            spray_damage *= 1.1
            tracer_damage *= 1.1
            exploder_projectile_damage *= 1.1
            exploder_explosion_damage *= 1.1
            aura_tick_damage *= 1.1
            orbit_damage *= 1.1
            molotov_damage *= 1.1
            break
        case "POWER CRYSTAL 2":
            spray_damage *= 1.2
            tracer_damage *= 1.2
            exploder_projectile_damage *= 1.2
            exploder_explosion_damage *= 1.2
            aura_tick_damage *= 1.2
            orbit_damage *= 1.2
            molotov_damage *= 1.2
            break
        case "POWER CRYSTAL 3":
            weapon_knockback = WEAPON_KNOCKBACK_VELOCITY
            break

        case "AURA RING":
            exploder_explosion_scale *= 1.2
            aura_scale *= 1.2
            molotov_flame_scale *= 1.2
            break
        case "AURA RING 2":
            exploder_explosion_scale *= 1.2
            aura_scale *= 1.2
            molotov_flame_scale *= 1.2
            break
        case "AURA RING 3":
            exploder_explosion_damage *= 2
            aura_tick_damage *= 2
            molotov_damage *= 2
            break

        case "GEM PRISM":
            hero_gem_collect_radius *= 1.5
            break
        case "GEM PRISM 2":
            start_auto_collect()
            hero_auto_collect_tick.rate = 10 * 4
            break
        case "GEM PRISM 3":
            gem_bonus_xp += 1
            break

        case "FAIRY FEATHER":
            hero_speed += 10
            hero_dodge += 10
            adjust_hero_speed()
            break
        case "FAIRY FEATHER 2":
            hero_speed += 20
            hero_dodge += 20
            adjust_hero_speed()
            break
        case "FAIRY FEATHER 3":
            hero_dodge_heal = 15
            break

        case "BLESSED CUP":
            hero_regen += 2
            break
        case "BLESSED CUP 2":
            molotov_tick_damage *= 1.1
            aura_tick_damage *= 1.1
            spray_damage *= 1.1
            break
        case "BLESSED CUP 3":
            molotov_duration_min *= 0.5
            molotov_duration_max *= 0.5
            aura_aoe_tick.rate *= 0.5
            spray_inaccuracy = 0
            break

        case "CROSS":
            spray_spawn_count += 2
            fire_on_next_tick(spray_spawn_tick)
            break
        case "CROSS 2":
            spray_spawn_count += 1
            break
        case "CROSS 3":
            spray_damage *= 1.5
            break
        case "CROSS 4":
            spray_spawn_count += 1
            break
        case "CROSS 5":
            spray_damage *= 2
            break

        case "SPARK":
            tracer_spawn_count += 1
            fire_on_next_tick(tracer_spawn_tick)
            break
        case "SPARK 2":
            tracer_damage *= 1.5
            break
        case "SPARK 3":
            tracer_spawn_tick.rate *= 0.75
            break
        case "SPARK 4":
            tracer_damage *= 2
            break
        case "SPARK 5":
            tracer_spawn_count += 1
            break

        case "FIREBALL":
            explosive_spawn_count += 1
            fire_on_next_tick(exploder_spawn_tick)
            break
        case "FIREBALL 2":
            exploder_projectile_damage *= 2
            exploder_explosion_damage *= 2
            break
        case "FIREBALL 3":
            exploder_explosion_scale += 0.50
            break
        case "FIREBALL 4":
            exploder_speed *= 1.5
            exploder_duration = exploder_duration * 2 / 3
            break
        case "FIREBALL 5":
            exploder_projectile_damage *= 2
            exploder_explosion_damage *= 2
            break

        case "SPELLBOOK":
            orbit_spawn_count += 1
            fire_on_next_tick(orbit_spawn_tick)
            break
        case "SPELLBOOK 2":
            orbit_spawn_count += 1
            break
        case "SPELLBOOK 3":
            orbit_damage *= 1.5
            break
        case "SPELLBOOK 4":
            orbit_spawn_count += 1
            break
        case "SPELLBOOK 5":
            orbit_damage *= 1.5
            break

        case "DIVINE AURA":
            aura_spawn_count += 1
            create_new_aura()
            break
        case "DIVINE AURA 2":
            aura_scale += 0.2
            adjust_aura_scale()
            break
        case "DIVINE AURA 3":
            aura_tick_damage *= 1.5
            break
        case "DIVINE AURA 4":
            aura_scale += 0.2
            adjust_aura_scale()
            break
        case "DIVINE AURA 5":
            aura_tick_damage *= 2
            break

        case "HOLY WATER":
            molotov_spawn_count += 1
            fire_on_next_tick(molotov_spawn_tick)
            break
        case "HOLY WATER 2":
            molotov_flame_duration *= 1.5
            break
        case "HOLY WATER 3":
            molotov_flame_scale += 0.5
            break
        case "HOLY WATER 4":
            molotov_tick_damage *= 2
            break
        case "HOLY WATER 5":
            molotov_aoe_tick.rate *= 0.5
            break
    }
    redraw_upgrades()
}

function redraw_upgrades() {
    if(!upgrade_ui_sprite) {
        upgrade_ui.fill(0)
        upgrade_ui_sprite = sprites.create(upgrade_ui, SpriteKind.UI)
        upgrade_ui_sprite.setFlag(SpriteFlag.RelativeToCamera, true)
        upgrade_ui_sprite.z = Z_UI
        upgrade_ui_sprite.top = 2
        upgrade_ui_sprite.left = 2        
    }

    let icon_position = 0
    for (let icon of custom.get_obtained_upgrade_icons()) {
        upgrade_ui.drawImage(icon, icon_position, 0)
        icon_position += icon.width + 2
    }
}

/*
HERO EVENTS
*/

statusbars.onStatusReached(StatusBarKind.Experience, statusbars.StatusComparison.GTE, statusbars.ComparisonType.Percentage, 100, function (status) {
    status.value = 0
    status.max = Math.floor(status.max + hero_xp_increment)
    hero_level += 1
    choose_upgrade("YOU REACHED LV. " + hero_level + "!")
})

statusbars.onZero(StatusBarKind.Health, function (status) {
    if (status == hero_health) {
        game.splash("DEFEAT", "Better luck next time...")
        show_stats(enemy_extra_difficulty > 0, true, false, true)
        game.over(false)
    }
})

function start_auto_collect() {
    hero_auto_collect_tick = start_tick_track(auto_collect_all_gems)
}

function auto_collect_all_gems() {
    for(let gem of sprites.allOfKind(SpriteKind.PickUp)) {
        gem.follow(hero, GEM_FLY_SPEED)
    }
}

function regenerate_hero() {
    hero_health.value += hero_regen
}

function adjust_hero_speed() {
    if(custom.game_state_is(GameState.normal)) {
        controller.moveSprite(hero, hero_speed, hero_speed)
    }
}

/*
ENEMY SPAWNING
*/
// CONTAINS GAME DESIGN
function setup_enemy_phase() {
    switch(enemy_phase) {
        case 0:
            custom.reset_wave_data()
            custom.add_wave_data(1, 2, "ZOMBIE")
            break
        case 1:
            custom.add_wave_data(2, 1, "KNIGHT")
            custom.add_wave_data(3, 2, "ZOMBIE")
            break
        case 2:
            custom.add_wave_data(4, 1, "KNIGHT")
            custom.add_wave_data(5, 2, "ZOMBIE")
            break


        // Player Lv 5
        case 3:
            custom.reset_wave_data()
            custom.add_wave_data(1, 1, "MUMMY")
            custom.add_wave_data(3, 1, "MUMMY")
            custom.add_wave_data(5, 1, "MUMMY")
            spawn_enemy("SKELETON MAGE")
            break


        case 5:
            custom.reset_wave_data()
            custom.add_wave_data(2, 3, "ZOMBIE")
            custom.add_wave_data(4, 2, "KNIGHT")
            custom.add_wave_data(3, 1, "GHOST")
            break
        case 6:
            custom.add_wave_data(1, 1, "GHOST")
            custom.add_wave_data(5, 1, "GHOST")
            break
        case 7:
            custom.reset_wave_data()
            custom.add_wave_data(2, 2, "KNIGHT")
            custom.add_wave_data(4, 2, "KNIGHT")
            custom.add_wave_data(3, 2, "GHOST")
            custom.add_wave_data(3, 1, "CAPTAIN")
            break
        case 8:
            custom.add_wave_data(1, 2, "SLIME")
            custom.add_wave_data(2, 1, "TOUGH SLIME")
            custom.add_wave_data(3, 2, "SLIME")
            custom.add_wave_data(4, 1, "TOUGH SLIME")
            custom.add_wave_data(5, 2, "SLIME")
            break


        case 9:
            custom.reset_wave_data()
            custom.add_wave_data(1, 1, "SLIME")
            custom.add_wave_data(2, 1, "SLIME")
            custom.add_wave_data(3, 1, "SLIME")
            custom.add_wave_data(4, 1, "SLIME")
            custom.add_wave_data(5, 1, "SLIME")
            spawn_enemy("SLIME KING")
            break
        

        case 12:
            custom.reset_wave_data()
            custom.add_wave_data(1, 1, "LAVA ZOMBIE")
            custom.add_wave_data(2, 2, "ZOMBIE")
            custom.add_wave_data(3, 2, "GHOST")
            custom.add_wave_data(4, 1, "LAVA ZOMBIE")
            custom.add_wave_data(5, 2, "ZOMBIE")
            break
        case 13:
            custom.add_wave_data(1, 1, "LAVA ZOMBIE")
            custom.add_wave_data(5, 1, "LAVA ZOMBIE")
            break
        case 14:
            custom.reset_wave_data()
            custom.add_wave_data(1, 1, "LAVA ZOMBIE")
            custom.add_wave_data(2, 1, "KNIGHT")
            custom.add_wave_data(3, 2, "GHOST")
            custom.add_wave_data(4, 1, "KNIGHT")
            custom.add_wave_data(5, 1, "LAVA ZOMBIE")
            break
        case 15:
            custom.add_wave_data(1, 1, "LAVA ZOMBIE")
            custom.add_wave_data(2, 1, "CAPTAIN")
            custom.add_wave_data(3, 2, "MEAN SPIRIT")
            custom.add_wave_data(4, 1, "CAPTAIN")
            custom.add_wave_data(5, 1, "LAVA ZOMBIE")
            break


        case 16:
            custom.reset_wave_data()
            custom.add_wave_data(1, 2, "TOUGH SLIME")
            custom.add_wave_data(2, 2, "TOUGH SLIME")
            custom.add_wave_data(3, 2, "TOUGH SLIME")
            custom.add_wave_data(4, 2, "TOUGH SLIME")
            custom.add_wave_data(5, 2, "TOUGH SLIME")
            break
        case 17:
            spawn_enemy("TROLL")
            cat_inside_chest = true
            break

        default:
            if(enemy_phase >= 18) {
                if (!cat_out_of_chest) {
                    custom.add_wave_data(1, 1, "TOUGH SLIME")
                    custom.add_wave_data(2, 1, "TOUGH SLIME")
                    custom.add_wave_data(3, 1, "TOUGH SLIME")
                    custom.add_wave_data(4, 1, "TOUGH SLIME")
                    custom.add_wave_data(5, 1, "TOUGH SLIME")
                } else {
                    if (enemy_extra_difficulty == 0) {
                        custom.reset_wave_data()
                        custom.add_wave_data(1, 2, "MUMMY")
                        custom.add_wave_data(2, 2, "SLIME")
                        custom.add_wave_data(3, 2, "GHOST")
                        custom.add_wave_data(4, 2, "KNIGHT")
                        custom.add_wave_data(5, 2, "TOUGH SLIME")
                    }

                    enemy_extra_difficulty += 1
                    effects.blizzard.startScreenEffect(1000)

                    for (let existing_enemy of sprites.allOfKind(SpriteKind.Enemy)) {
                        tweak_enemy(existing_enemy)
                    }

                    const dice_roll_enemy = Math.pickRandom([
                        "MUMMY",
                        "KNIGHT",
                        "TOUGH SLIME",
                        "LAVA ZOMBIE",
                        "CAPTAIN",
                        "MEAN SPIRIT",
                    ])
                    const dice_roll_wave = Math.randomRange(1, 5)
                    if (custom.get_wave_enemy_count(dice_roll_wave) < MAX_ENEMIES) {
                        custom.add_wave_data(dice_roll_wave, 1, dice_roll_enemy)
                    }

                    if (enemy_phase % 2 == 0 && cat_out_of_chest) {
                        const dice_roll_boss = Math.pickRandom([
                            "SKELETON MAGE",
                            "SLIME KING",
                            "TROLL"
                        ])
                        spawn_enemy(dice_roll_boss)
                    }
                }
            }
            break
    }
}

function despawn_enemy(destroy_candidate: Sprite) {
    if (sprites.readDataBoolean(destroy_candidate, "boss")) {
        custom.move_sprite_off_camera(destroy_candidate)
    } else {
        destroy_candidate.destroy()
    }
}

function spawn_enemy(name: string) {
    const enemies: Sprite[] = sprites.allOfKind(SpriteKind.Enemy)
    if (enemies.length >= MAX_ENEMIES) {

        if(!(["SKELETON MAGE", "SLIME KING", "TROLL"].indexOf(name) >= 0)) {
            return
        }
    }

    // CONTAINS GAME DESIGN
    let new_enemy: Sprite = null
    if (name == "ZOMBIE") {
        new_enemy = setup_enemy(assets.image`zombie`, zombie_flash, name, 12, 10, 25, 1)
    } else if (name == "LAVA ZOMBIE") {
        new_enemy = setup_enemy(assets.image`lava-zombie`, lava_zombie_flash, name, 90, 20, 30, 2)
    } else if (name == "MUMMY") {
        new_enemy = setup_enemy(assets.image`mummy`, mummy_flash, name, 30, 10, 25, 1)
    } else if (name == "KNIGHT") {
        new_enemy = setup_enemy(assets.image`knight`, knight_flash, name, 40, 15, 30, 1)
    } else if (name == "CAPTAIN") {
        new_enemy = setup_enemy(assets.image`captain`, captain_flash, name, 120, 30, 25, 2)
    } else if (name == "GHOST") {
        new_enemy = setup_enemy(assets.image`ghost`, ghost_flash, name, 30, 20, 40, 1, false)
    } else if (name == "MEAN SPIRIT") {
        new_enemy = setup_enemy(assets.image`mourner`, mean_spirit_flash, name, 60, 25, 40, 2, false)
    } else if (name == "SKELETON MAGE") {
        if(enemy_extra_difficulty <= 0) {
            new_enemy = setup_enemy(assets.image`skeleton-mage`, skeleton_mage_flash, name, 350 * (hyper_mode ? HYPER_BOSS_HP_SCALE : 1), 30, 20, 3, true, true)
        } else {
            new_enemy = setup_enemy(assets.image`skeleton-mage`, skeleton_mage_flash, name, 800 * (hyper_mode ? HYPER_BOSS_HP_SCALE : 1), 30, 20, 3, true, true)
        }
    } else if (name == "SLIME") {
        new_enemy = setup_enemy(assets.image`slime`, slime_flash, name, 24, 15, 35, 1)
    } else if (name == "TOUGH SLIME") {
        new_enemy = setup_enemy(assets.image`tough-slime`, tough_slime_flash, name, 48, 25, 35, 1)
    } else if (name == "SLIME KING") {
        if (enemy_extra_difficulty <= 0) {
            new_enemy = setup_enemy(assets.image`slime-king`, slime_king_flash, name, 800 * (hyper_mode ? HYPER_BOSS_HP_SCALE : 1), 30, 30, 3, true, true)
        } else {
            new_enemy = setup_enemy(assets.image`slime-king`, slime_king_flash, name, 800 * (hyper_mode ? HYPER_BOSS_HP_SCALE : 1), 30, 30, 3, true, true)
        }
    } else if (name == "TROLL") {
        if (enemy_extra_difficulty <= 0) {
            new_enemy = setup_enemy(assets.image`troll`, troll_flash, name, 2000 * (hyper_mode ? HYPER_BOSS_HP_SCALE : 1), 50, 30, 3, true, true)
        } else {
            new_enemy = setup_enemy(assets.image`troll`, troll_flash, name, 800 * (hyper_mode ? HYPER_BOSS_HP_SCALE : 1), 50, 30, 3, true, true)
        }
    }
    custom.move_sprite_off_camera(new_enemy)
}

function tweak_enemy(enemy: Sprite) {
    sprites.setDataNumber(enemy, "damage", sprites.readDataNumber(enemy, "damage") * (1.0 + enemy_extra_difficulty * ENEMY_DAMAGE_SCALE))
    sprites.setDataNumber(enemy, "speed", sprites.readDataNumber(enemy, "speed") * (1.0 + enemy_extra_difficulty * ENEMY_SPEED_SCALE))
}

function setup_enemy(main_image: Image, flash_image: Image, name: string, health: number, damage: number, speed: number, drop_type: number, multi_hit: boolean = true, boss: boolean = false): Sprite {
    const enemy = sprites.create(main_image, SpriteKind.Enemy)
    sprites.setDataImage(enemy, "main_image", main_image)
    sprites.setDataImage(enemy, "flash_image", flash_image)
    sprites.setDataString(enemy, "name", name)
    sprites.setDataNumber(enemy, "health", health * (1.0 + (boss ? 0 : enemy_extra_difficulty * ENEMY_HEALTH_SCALE)))
    sprites.setDataNumber(enemy, "damage", damage * (1.0 + enemy_extra_difficulty * ENEMY_DAMAGE_SCALE))
    sprites.setDataNumber(enemy, "drop_type", drop_type)
    sprites.setDataNumber(enemy, "speed", Math.min(ENEMY_MAX_SPEED, speed * (hyper_mode ? HYPER_ENEMY_SPEED_SCALE : 1.0) * (1.0 + enemy_extra_difficulty * ENEMY_SPEED_SCALE)))
    enemy.follow(hero, speed, ENEMY_TURN_RATE)
    sprites.setDataBoolean(enemy, "boss", boss)
    sprites.setDataBoolean(enemy, "multi_hit", multi_hit)
    sprites.setDataBoolean(enemy, "attack_cooldown", false)
    sprites.setDataNumber(enemy, "flash", 0)
    sprites.setDataNumber(enemy, "stun", 0)
    enemy.z = Z_ENEMY
    enemy.setFlag(SpriteFlag.GhostThroughWalls, true)
    return enemy
}

/*
ENEMY EVENTS
*/

function move_hero_to_dodge(target:Sprite) {
    let shadow = sprites.create(assets.image`hero-shadow`, SpriteKind.VisualEffects)
    custom.move_sprite_on_top_of_another(shadow, hero)
    shadow.z = Z_DODGE_SHADOW
    shadow.setFlag(SpriteFlag.Ghost, true)
    shadow.destroy(effects.disintegrate, 600)
    custom.aim_projectile_at_sprite(hero, target, AimType.velocity, hero_dodge_speed)
    hero.vx *= -1
    hero.vy *= -1
    hero.fx = Math.abs(hero.vx) * 4
    hero.fy = Math.abs(hero.vy) * 4
    hero_health.value += hero_dodge_heal
}

function wound_hero(target:Sprite) {
    hero_health.value -= sprites.readDataNumber(target, "damage")
    wound_tracker.find(value => value.name == sprites.readDataString(target, "name")).total += sprites.readDataNumber(target, "damage")
    scene.cameraShake(Math.constrain(Math.floor(sprites.readDataNumber(target, "damage") / hero_health.max * 16), 2, 8), 250)
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (hero_sprite, enemy) {
    if (!(sprites.readDataBoolean(enemy, "attack_cooldown"))) {
        if (Math.percentChance(hero_dodge)) {
            move_hero_to_dodge(enemy)
            sprites.setDataBoolean(enemy, "attack_cooldown", true)
        } else {
            wound_hero(enemy)
            if (sprites.readDataBoolean(enemy, "multi_hit")) {
                sprites.setDataBoolean(enemy, "attack_cooldown", true)
            } else {
                enemy.destroy()
            }
        }
    }
})

/*
PICKUPS
*/

/*
PICKUP EVENTS
*/

sprites.onOverlap(SpriteKind.Player, SpriteKind.Treasure, function (sprite, otherSprite) {
    if(custom.game_state_is(GameState.normal)) {
        if (cat_inside_chest && !cat_out_of_chest) {
            cat_out_of_chest = true
            game.showLongText(
                "You found Jiji the black cat!\n" +
                "He's the source of the curse!\n" +
                "He isn't being mean though...\n" +
                "just a little naughty, maybe.\n" +
                "Anyway, the doors to the north is open.\n" +
                "You can now leave the castle!", DialogLayout.Bottom)
            tiles.setWallAt(tiles.getTilesByType(assets.tile`door-closed-left`)[0], false)
            tiles.setTileAt(tiles.getTilesByType(assets.tile`door-closed-left`)[0], assets.tile`door-open-left`)
            tiles.setWallAt(tiles.getTilesByType(assets.tile`door-closed-mid`)[0], false)
            tiles.setTileAt(tiles.getTilesByType(assets.tile`door-closed-mid`)[0], assets.tile`door-open-mid`)
            tiles.setWallAt(tiles.getTilesByType(assets.tile`door-closed-right`)[0], false)
            tiles.setTileAt(tiles.getTilesByType(assets.tile`door-closed-right`)[0], assets.tile`door-open-right`)
            let cat = sprites.create(assets.image`black-cat`, SpriteKind.NonInteractive)
            cat.z = Z_NPC
            cat.setFlag(SpriteFlag.Ghost, true)
            cat.follow(hero, 80)
            custom.move_sprite_on_top_of_another(cat, otherSprite)
        } else {
            get_random_upgrade(false, "You found treasure!")
        }
    }
    otherSprite.destroy()
})

scene.onOverlapTile(SpriteKind.Player, assets.tile`door-open-mid`, () => {
    game.splash("VICTORY", "You have lifted the curse!")
    settings.writeNumber("completed_game", 1)
    show_stats(true, false, true, true)
    game.over(true, effects.blizzard)
})

/*
GAME SETUP
*/

function setup_game () {
    tiles.setCurrentTilemap(tilemap`castle`)
    hero = sprites.create(assets.image`hero`, SpriteKind.Player)
    animation.runImageAnimation(
    hero,
    assets.animation`hero-anim`,
    400,
    true
    )
    hero.z = Z_HERO
    tiles.placeOnRandomTile(hero, sprites.dungeon.floorLight5)
    scene.cameraFollowSprite(hero)
    hero_health = statusbars.create(20, 4, StatusBarKind.Health)
    hero_health.attachToSprite(hero, 4, 0)
    hero_health.max = 200
    hero_health.value = 200
    hero_health.setColor(7, 2)
    hero_health.z = Z_UI
    hero_xp = statusbars.create(scene.screenWidth() - 40, 5, StatusBarKind.Experience)
    hero_xp.setLabel("EXP", 12)
    hero_xp.positionDirection(CollisionDirection.Bottom)
    hero_xp.setOffsetPadding(0, 4)
    hero_xp.max = 10
    hero_xp_increment = 5
    hero_xp.value = 0
    hero_xp.setColor(9, 15, 15)
    hero_xp.setStatusBarFlag(StatusBarFlag.SmoothTransition, false)
    hero_xp.z = Z_UI
    info.setScore(0)
    controller.moveSprite(hero, hero_speed, hero_speed)
    setup_upgrade_menu()
    enemy_phase = 0

    if(CHEAT_MODE) {
        enemy_phase = 20
        setup_enemy_phase()
        enemy_phase = 21
        for(let i=0; i<24; i++) {
            get_random_upgrade(true, "")
        }
    }
    setup_enemy_phase()
    custom.set_game_state(GameState.normal)
}

/*
GAME ACTIONS
*/

function unpause_the_game() {
    for (let upgrade_icon of sprites.allOfKind(SpriteKind.Enemy)) {
        upgrade_icon.follow(hero, sprites.readDataNumber(upgrade_icon, "speed"), ENEMY_TURN_RATE)
    }
    controller.moveSprite(hero, hero_speed, hero_speed)
    if (aura_spawn_count > 0) {
        aura_weapon.setFlag(SpriteFlag.Invisible, false)
    }
    custom.set_game_state(GameState.normal)
}

function pause_the_game() {
    custom.set_game_state(GameState.menu)
    for (let value2 of sprites.allOfKind(SpriteKind.Enemy)) {
        value2.follow(hero, 0)
    }
    sprites.destroyAllSpritesOfKind(SpriteKind.Orbital)
    sprites.destroyAllSpritesOfKind(SpriteKind.Flame)
    sprites.destroyAllSpritesOfKind(SpriteKind.Molotov)
    sprites.destroyAllSpritesOfKind(SpriteKind.Explosive)
    sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
    sprites.destroyAllSpritesOfKind(SpriteKind.VisualEffects)
    if (aura_spawn_count > 0) {
        aura_weapon.setFlag(SpriteFlag.Invisible, true)
    }
    controller.moveSprite(hero, 0, 0)
}

/*
WEAPONS
*/
function drop_gem(enemy:Sprite, image:Image, xp:number): Sprite {
    let new_drop = sprites.create(image, SpriteKind.PickUp)
    new_drop.z = Z_PICKUP
    new_drop.setFlag(SpriteFlag.Ghost, true)
    sprites.setDataNumber(new_drop, "xp", xp * (hyper_mode ? HYPER_XP_MULTIPLIER : 1))
    custom.move_sprite_on_top_of_another(new_drop, enemy)
    if(Math.percentChance(hero_auto_collect_chance)) {
        new_drop.follow(hero, GEM_FLY_SPEED)
    }
    return new_drop
}

function deal_enemy_damage(sx: number, sy: number, enemy: Sprite, name: string, damage: number, knockback: number) {
    const drops: Sprite[] = sprites.allOfKind(SpriteKind.PickUp)
    let new_drop: Sprite = null
    if (drops.length >= MAX_DROPS) {
        drops.reduce((farthest, drop) => custom.get_distance_between(drop, hero) > custom.get_distance_between(farthest, hero) ? drop : farthest, drops[0]).destroy()
    }
    sprites.changeDataNumberBy(enemy, "health", -damage)
    damage_tracker.find(value => value.name == name).total += damage

    if(knockback > 0) {
        enemy.follow(null)

        let knockback_scale = knockback / Math.sqrt((enemy.x - sx) * (enemy.x - sx) + (enemy.y -sy) * (enemy.y -sy))
        enemy.vx = (enemy.x - sx) * knockback_scale
        enemy.vy = (enemy.y - sy) * knockback_scale
        sprites.setDataNumber(enemy, "stun", 3)
        enemy.fx = ENEMY_KNOCKBACK_FRICTION
        enemy.fy = ENEMY_KNOCKBACK_FRICTION

        // this resets velocity, unlike setting it to 0 which still preserved momentum
    }

    if (sprites.readDataNumber(enemy, "health") <= 0) {
        kill_tracker.find(tracker => tracker.name == sprites.readDataString(enemy, "name")).total += 1
        if (sprites.readDataNumber(enemy, "drop_type") > 0
            && Math.percentChance(HEAL_DROP_CHANCE)
            && sprites.allOfKind(SpriteKind.Food).length < MAX_FOOD) {
            let new_food = sprites.create(assets.image`health-potion`, SpriteKind.Food)
            new_food.z = Z_TREASURE_FOOD
            custom.aim_projectile_at_angle(
                new_food,
                randint(0, 360),
                AimType.position,
                randint(5, 10),
                enemy
            )
        }
        if (sprites.readDataNumber(enemy, "drop_type") == 1) {
            new_drop = drop_gem(enemy, assets.image`blue gem`, 2)
        } else if (sprites.readDataNumber(enemy, "drop_type") == 2) {
            new_drop = drop_gem(enemy, assets.image`green gem`, 4)
        } else if (sprites.readDataNumber(enemy, "drop_type") == 3) {
            new_drop = drop_gem(enemy, assets.image`red gem`, 16)
            custom.aim_projectile_at_angle(
                new_drop,
                randint(0, 360),
                AimType.position,
                randint(10, 20),
                enemy
            )
            let new_treasure = sprites.create(assets.image`treasure`, SpriteKind.Treasure)
            new_treasure.z = Z_TREASURE_FOOD
            custom.move_sprite_on_top_of_another(new_treasure, enemy)
        }
        enemy.destroy(effects.disintegrate)
    } else {
        enemy.setImage(sprites.readDataImage(enemy, "flash_image"))
        sprites.setDataNumber(enemy, "flash", 2)
    }
}

function create_new_aura() {
    if(hero) {
        aura_weapon = sprites.create(assets.image`area32x32`, SpriteKind.NonInteractive)
        aura_weapon.z = Z_AURA
        aura_weapon.scale = aura_scale
        animation.runImageAnimation(
            aura_weapon,
            assets.animation`divine-aura`,
            500,
            true
        )
        custom.move_sprite_on_top_of_another(aura_weapon, hero)
        sprites.setDataString(aura_weapon, "name", "DIVINE AURA")
        sprites.setDataNumber(aura_weapon, "damage", aura_tick_damage)

    }
}

function damage_enemies_in_aura(aura: Sprite, pushback: number) {
    for (let aura_target of sprites.allOfKind(SpriteKind.Enemy)) {
        if ((aura_target.width + aura_target.height) / 4 + (aura.width / 2) > custom.get_distance_between(aura, aura_target)) {
            deal_enemy_damage(aura.x, aura.y, aura_target, sprites.readDataString(aura, "name"), sprites.readDataNumber(aura, "damage"), pushback)
        }
    }
}

function adjust_aura_scale() {
    if(aura_weapon) {
        aura_weapon.scale = aura_scale
    }
}

/*
WEAPONS EVENTS
*/

sprites.onDestroyed(SpriteKind.Molotov, function (sprite) {
    let flame_weapon = sprites.create(assets.image`area32x32`, SpriteKind.Flame)
    animation.runImageAnimation(
        flame_weapon,
        assets.animation`myAnim`,
        150,
        true
    )
    flame_weapon.z = Z_FLAME
    flame_weapon.setFlag(SpriteFlag.Ghost, true)
    flame_weapon.setPosition(sprite.x, sprite.y)
    flame_weapon.scale = molotov_flame_scale
    flame_weapon.lifespan = molotov_flame_duration
    sprites.setDataNumber(flame_weapon, "damage", molotov_tick_damage)
    sprites.setDataString(flame_weapon, "name", "HOLY WATER")
})

sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(otherSprite.x - sprite.vx, otherSprite.y - sprite.vy, otherSprite, sprites.readDataString(sprite, "name"), sprites.readDataNumber(sprite, "damage"), weapon_knockback)
    sprite.destroy()
})

sprites.onDestroyed(SpriteKind.Explosive, function (sprite) {
    let explosion = sprites.create(assets.image`area32x32`, SpriteKind.VisualEffects)
    animation.runImageAnimation(
        explosion,
        assets.animation`explosion-anim`,
        100,
        false
    )
    explosion.setPosition(sprite.x, sprite.y)
    explosion.setFlag(SpriteFlag.Ghost, true)
    explosion.z = Z_EXPLOSION
    explosion.scale = exploder_explosion_scale
    explosion.lifespan = 500
    sprites.setDataNumber(explosion, "damage", exploder_explosion_damage)
    sprites.setDataString(explosion, "name", "FIREBALL")
    damage_enemies_in_aura(explosion, weapon_knockback)
})

sprites.onOverlap(SpriteKind.Orbital, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(hero.x, hero.y, otherSprite, sprites.readDataString(sprite, "name"), sprites.readDataNumber(sprite, "damage"), weapon_knockback / 2)
    sprite.destroy()
})

sprites.onOverlap(SpriteKind.Explosive, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(0, 0, otherSprite, sprites.readDataString(sprite, "name"), sprites.readDataNumber(sprite, "damage"), 0)
    sprite.destroy()
})

/*
TICK EVENTS
*/

function spawn_explosive() {
    if(explosive_spawn_count > 0) {
        for (let index = 0; index < explosive_spawn_count + bonus_magic_spawn; index++) {
            let new_weapon = sprites.create(assets.image`fireball`, SpriteKind.Explosive)
            new_weapon.z = Z_PROJECTILE
            custom.aim_projectile_at_angle(
                new_weapon,
                randint(0, 360),
                AimType.velocity,
                exploder_speed,
                hero
            )
            new_weapon.lifespan = exploder_duration
            new_weapon.setFlag(SpriteFlag.DestroyOnWall, true)
            sprites.setDataString(new_weapon, "name", "FIREBALL")
            sprites.setDataNumber(new_weapon, "damage", exploder_projectile_damage)
        }
    }
}

function aura_aoe() {
    if (aura_spawn_count > 0) {
        damage_enemies_in_aura(aura_weapon, aura_tick_pushback)
    }
}

function spawn_molotov() {
    for (let index = 0; index < molotov_spawn_count; index++) {
        let new_weapon = sprites.create(assets.image`weapon-water`, SpriteKind.Molotov)
        new_weapon.z = Z_PROJECTILE
        new_weapon.lifespan = randint(molotov_duration_min, molotov_duration_max)
        custom.aim_projectile_at_angle(
        new_weapon,
        randint(0, 360),
        AimType.velocity,
        molotov_speed,
        hero
        )
        new_weapon.setFlag(SpriteFlag.DestroyOnWall, true)
        new_weapon.setFlag(SpriteFlag.Ghost, true)
    }
}

function spawn_spray() {
    let spray_angle = hero_angle
    spray_angle -= spray_spawn_count * SPRAY_ANGLE_DELTA / 2
    spray_angle += Math.randomRange(-spray_inaccuracy, spray_inaccuracy)
    let weapon_image:Image = null

    for (let index = 0; index < spray_spawn_count; index++) {
        let new_weapon = sprites.create(assets.image`weapon-cross`, SpriteKind.Projectile)
        new_weapon.z = Z_PROJECTILE
        custom.aim_projectile_at_angle(
        new_weapon,
        spray_angle,
        AimType.velocity,
        spray_speed,
        hero
        )
        new_weapon.setFlag(SpriteFlag.AutoDestroy, true)
        new_weapon.setFlag(SpriteFlag.DestroyOnWall, true)
        new_weapon.lifespan = DEFAULT_WEAPON_LIFESPAN
        sprites.setDataString(new_weapon, "name", "CROSS")
        sprites.setDataNumber(new_weapon, "damage", spray_damage)
        spray_angle += SPRAY_ANGLE_DELTA
    }
}


function spawn_orbit() {
    // this check is necessary to prevent a divided by 0 error
    if (orbit_spawn_count > 0) {
        sprites.destroyAllSpritesOfKind(SpriteKind.Orbital)
        let spawn_angle_spacing = 360 / (orbit_spawn_count + bonus_magic_spawn)
        for (let orbit = 0; orbit < orbit_spawn_count + bonus_magic_spawn; orbit++) {
            let new_weapon = sprites.create(assets.image`weapon-book`, SpriteKind.Orbital)
            new_weapon.z = Z_PROJECTILE
            new_weapon.lifespan = orbit_duration
            sprites.setDataNumber(new_weapon, "angle", spawn_angle_spacing * orbit)
            custom.aim_projectile_at_angle(
            new_weapon,
            sprites.readDataNumber(new_weapon, "angle"),
            AimType.position,
            orbit_distance,
            hero
            )
            sprites.setDataString(new_weapon, "name", "SPELLBOOK")
            sprites.setDataNumber(new_weapon, "damage", orbit_damage)
        }
    }
}

function molotov_aoe() {
    if (molotov_spawn_count > 0) {
        for (let molotov_fire_weapon of sprites.allOfKind(SpriteKind.Flame)) {
            damage_enemies_in_aura(molotov_fire_weapon, 0)
        }
    }
}

function spawn_tracer() {
    if(tracer_spawn_count > 0) {
        for (let index = 0; index < tracer_spawn_count + bonus_magic_spawn; index++) {
            let new_weapon = sprites.create(assets.image`spark`, SpriteKind.Projectile)
            new_weapon.z = Z_PROJECTILE
            new_weapon.startEffect(effects.trail)
            custom.aim_projectile_at_angle(
                new_weapon,
                randint(0, 360),
                AimType.velocity,
                tracer_speed,
                hero
            )
            custom.aim_projectile_at_sprite(
                new_weapon,
                sprites.allOfKind(SpriteKind.Enemy)._pickRandom(),
                AimType.velocity,
                tracer_speed
            )
            new_weapon.lifespan = DEFAULT_WEAPON_LIFESPAN
            new_weapon.setFlag(SpriteFlag.DestroyOnWall, true)
            sprites.setDataString(new_weapon, "name", "SPARK")
            sprites.setDataNumber(new_weapon, "damage", tracer_damage)
        }
    }
}

function next_enemy_phase() {
    enemy_phase += 1
    setup_enemy_phase()
}

function spawn_enemy_wave() {
    let list = custom.get_wave_enemy_list()
    for (let next_enemy of list) {
        spawn_enemy(next_enemy)
    }
    custom.advance_wave()
}

function reset_enemy_attack_cooldown() {
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        sprites.setDataBoolean(enemy, "attack_cooldown", false)
    }
}

game.onUpdateInterval(100, () => {
    if(custom.game_state_is(GameState.normal)) {
        let status = 0
        for(let enemy of sprites.allOfKind(SpriteKind.Enemy)) {            
            status = sprites.readDataNumber(enemy, "flash")
            if(status > 0) {
                status--
                sprites.setDataNumber(enemy, "flash", status)
                if(status == 0) {
                    enemy.setImage(sprites.readDataImage(enemy, "main_image"))
                }
            }

            status = sprites.readDataNumber(enemy, "stun")
            if (status > 0) {
                status--
                sprites.setDataNumber(enemy, "stun", status)
                if (status == 0) {
                    enemy.fx = 0
                    enemy.fy = 0
                    enemy.follow(hero, sprites.readDataNumber(enemy, "speed"))
                }
            }

        }
    }
})

game.onUpdateInterval(250, () => {
    if(custom.game_state_is(GameState.normal)) {
        for (let ticker of tick_trackers) {
            ticker.count++
            if(ticker.count >= ticker.rate) {
                ticker.count = 0
                ticker.event()
            }
        }
    }
})

/*
GLOBAL ON FRAME EVENTS
*/


let press_b = 0
let b_released = true

game.onUpdate(function () {

    if(controller.B.isPressed()) {
        if(b_released) {
            b_released = false
            if (custom.game_state_is(GameState.setup)) {
                press_b++
                if (press_b >= 10) {
                    settings.remove("high-score")
                    settings.writeNumber("seen_intro", 0)
                    settings.writeNumber("completed_game", 0)
                    start_main_menu()
                    press_b = 0
                }
            } else if (custom.game_state_is(GameState.normal)) {
                info.changeScoreBy(1)
                show_stats(CHEAT_MODE, CHEAT_MODE, false, false)
            }
        }
    } else {
        b_released = true
    }

    for (let moving_orbital of sprites.allOfKind(SpriteKind.Orbital)) {
        sprites.changeDataNumberBy(moving_orbital, "angle", orbit_angular_speed)
        custom.aim_projectile_at_angle(
            moving_orbital,
            sprites.readDataNumber(moving_orbital, "angle"),
            AimType.position,
            orbit_distance,
            hero
        )
    }

    if( custom.game_state_is(GameState.normal) ) {
        let distance = 0
        for (let pickup of sprites.allOfKind(SpriteKind.PickUp)) {
            distance = custom.get_distance_between(pickup, hero)
            if (distance < hero.width * 0.75) {
                hero_xp.value += sprites.readDataNumber(pickup, "xp") + gem_bonus_xp
                info.changeScoreBy(sprites.readDataNumber(pickup, "xp") + gem_bonus_xp)
                pickup.destroy()
            } else if (distance < hero_gem_collect_radius) {
                pickup.follow(hero, GEM_FLY_SPEED)
            } else if (distance > scene.screenWidth()) {
                pickup.destroy()
            }
        }

        for (let pickup of sprites.allOfKind(SpriteKind.Food)) {
            distance = custom.get_distance_between(pickup, hero)
            if (distance < hero.width / 2 + pickup.width / 2) {
                hero_health.value += hero_food_heal
                pickup.destroy()
            } else if (distance > scene.screenWidth()) {
                custom.move_sprite_off_camera(pickup)
            }
        }

        const enemies = sprites.allOfKind(SpriteKind.Enemy)
        if(enemies.length > MAX_ENEMIES / 2) {
            for (let enemy of enemies) {
                distance = custom.get_distance_between(enemy, hero)
                if (distance > scene.screenWidth() * 3 / 4) {
                    custom.move_sprite_off_camera(enemy)
                }
            }
        }

        if (aura_spawn_count > 0) {
            aura_weapon.setPosition(hero.x, hero.y)
        }
    }
})


/**
 * STATS SCREENS
 */
class SummaryDialog extends game.BaseDialog {
    line1:string
    line2: string
    line_color: number
    stat_title: string
    rows_per_column: number
    tracked_stats: StatTracking[]
    
    constructor(line1: string, line2: string, line_color: number, stat_title: string, rows_per_column: number, tracked_stats: StatTracking[]) {
        super(scene.screenWidth() - 20, scene.screenHeight() - 20, assets.image`dialog-frame`)
        this.line1 = line1
        this.line2 = line2
        this.line_color = line_color
        this.stat_title = stat_title
        this.rows_per_column = rows_per_column
        this.tracked_stats = tracked_stats
        this.update()
    }

    update() {
        this.drawBorder()

        let y = 10
        this.image.print(this.line1, 10, y, this.line_color)
        y += 8

        if(this.line2) {
            this.image.print(this.line2, 10, y, this.line_color)
            y += 8
        }

        y += 8
        this.image.print(this.stat_title, 10, y, 15)
        y += 8 + 4

        const total_max = this.tracked_stats.reduce((best, next) => next.total > best ? next.total : best, 1)
        const column_width = (scene.screenWidth() - 40 - 20) / 2
        
        let draw_stat = (icon: Image, level: string, value: number, max: number, col:number, row:number) => {
            let dx = 10 + col * column_width
            let bar_left = 12 + 2
            const dy = y + 12 * row

            this.image.drawImage(icon, dx, dy)
            dx += 12

            if(level) {
                this.image.print(level, dx, dy + 1, 15)
                dx += 6
                bar_left += 6
            }

            dx += 2
            const bar_max = column_width - bar_left - 4

            if(value > 0) {
                this.image.fillRect(dx, dy, Math.max(1, bar_max * 1.0 * value / max), 10, 7)
            }
        }

        this.tracked_stats.sort((a, b) => b.total - a.total)
        for(let i=0; i<this.tracked_stats.length; i++) {
            const stat = this.tracked_stats[i]
            draw_stat(
                stat.icon,
                stat.label,
                stat.total,
                total_max,
                i < this.rows_per_column ? 0 : 1,
                i % this.rows_per_column
            )
        }
    }
}

function tracked_total_sum(tracker_set:StatTracking[]): number {
    return Math.round(tracker_set.reduce((count, next) => count + next.total, 0))
}

function show_stats(show_hero_stats: boolean, show_enemy_stats: boolean, winning: boolean, end_game: boolean) {
    pause_the_game()
    game.pushScene()

    const strongest_weapon_name = custom.get_strongest_upgrade()
    const hero_class = hero_builds.find(build => build.strongest_weapon
        ? build.strongest_weapon == strongest_weapon_name
        : build.prerequsites.every(prereq => custom.has_upgrade(prereq))
    )
    const class_name = hero_class ? hero_class.name : "COLLECTOR"
    const class_color = hero_class ? hero_class.color : 15
    const upgrades = custom.get_obtained_upgrade_names()
    const hero_summary = new SummaryDialog(class_name, `LV ${hero_level}`, class_color, `TOTAL DAMAGE: ${tracked_total_sum(damage_tracker)}`, 3,
        damage_tracker
            .filter(tracked => upgrades.indexOf(tracked.name) >= 0)
            .map(tracker => ({
                name: tracker.name,
                icon: tracker.icon,
                total: tracker.total,
                label: custom.get_upgrade_level_of(tracker.name).toString()
            }))
    )

    const panel = assets.image`castle-background`.clone()
    if(show_hero_stats) {
        panel.drawTransparentImage(assets.image`hero-foreground`, menu_image.width - assets.image`hero-foreground`.width, 0)
    }
    const button_prompt = sprites.create(assets.image`hero`, SpriteKind.NonInteractive)    
    animation.runImageAnimation(button_prompt, assets.animation`a-prompt`, 500, true)
    button_prompt.x = scene.screenWidth() - 20
    button_prompt.y = scene.screenHeight() - 18
    button_prompt.setFlag(SpriteFlag.Invisible, true)

    const pause_stats = () => {
        pause(200)
        button_prompt.setFlag(SpriteFlag.Invisible, false)
        controller.A.pauseUntil(ControllerButtonEvent.Pressed)
        button_prompt.setFlag(SpriteFlag.Invisible, true)
    }

    panel.drawTransparentImage(hero_summary.image, 10, 10)
    scene.setBackgroundImage(panel)
    pause_stats()    

    if(show_hero_stats) {
        const winning_summary = new SummaryDialog(
            "HERO STATS",
            "",
            15,
            `TOTAL DEFEATED: ${tracked_total_sum(kill_tracker)}`,
            4,
            kill_tracker
                .filter(stat => stat.total > 0)
                .slice(0, 8)
        )

        panel.drawTransparentImage(winning_summary.image, 10, 10)
        pause_stats()

    }

    if(show_enemy_stats) {
        const losing_summary = new SummaryDialog(
            "MONSTER STATS",
            `LV ${(enemy_phase+1).toString()}` + (enemy_extra_difficulty > 0 ? `(+${enemy_extra_difficulty})` : ""),
            15,
            `DAMAGE TAKEN: ${tracked_total_sum(wound_tracker)}`,
            3,
            wound_tracker
                .filter(stat => stat.total > 0)
                .slice(0, 6)
            )

        panel.drawTransparentImage(losing_summary.image, 10, 10)        
        pause_stats()
    }

    panel.drawImage(assets.image`castle-background`, 0, 0)
    if (winning) {
        panel.drawTransparentImage(assets.image`hero-foreground`, menu_image.width - assets.image`hero-foreground`.width, 0)
    }

    if(end_game) {
        pause(500)
    }
    game.popScene()
    unpause_the_game()
}

/*
MAIN
*/
start_main_menu()