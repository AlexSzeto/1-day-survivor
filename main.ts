namespace SpriteKind {
    export const NonInteractive = SpriteKind.create()

    export const Orbital = SpriteKind.create()
    export const Molotov = SpriteKind.create()
    export const Flame = SpriteKind.create()
    export const Explosive = SpriteKind.create()

    export const PickUp = SpriteKind.create()
    export const Treasure = SpriteKind.create()

    export const UpgradeIcons = SpriteKind.create()
}

namespace StatusBarKind {
    export const Experience = StatusBarKind.create()
}

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
const ENEMY_DAMAGE_SCALE = 0.1
const ENEMY_HEALTH_SCALE = 0.25
const ENEMY_SPEED_SCALE = 0.05
const ENEMY_TURN_RATE = 100

const HEAL_DROP_CHANCE = 4

/*
GLOBALS
*/
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

let exploder_spawn_count = 0
let exploder_spawn_tick: TickTracking = start_tick_track(spawn_exploder)
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

let bonus_magic_spawn = 0

type StatTracking = {
    name: string
    total: number
}

let damage_tracker:StatTracking[] = [
    {
        name: "CROSS",
        total: 0
    },
    {
        name: "SPARK",
        total: 0
    },
    {
        name: "FIREBALL",
        total: 0
    },
    {
        name: "DIVINE AURA",
        total: 0
    },
    {
        name: "SPELLBOOK",
        total: 0
    },
    {
        name: "HOLY WATER",
        total: 0
    },
]

function make_enemy_stat(): StatTracking[] {
    return [
        {
            name: "ZOMBIE",
            total: 0
        },
        {
            name: "KNIGHT",
            total: 0
        },
        {
            name: "MUMMY",
            total: 0
        },
        {
            name: "SLIME",
            total: 0
        },
        {
            name: "TOUGH SLIME",
            total: 0
        },
        {
            name: "GHOST",
            total: 0
        },
        {
            name: "LAVA ZOMBIE",
            total: 0
        },
        {
            name: "MEAN SPIRIT",
            total: 0
        },
        {
            name: "CAPTAIN",
            total: 0
        },
        {
            name: "SKELETON MAGE",
            total: 0
        },
        {
            name: "SLIME KING",
            total: 0
        },
        {
            name: "TROLL",
            total: 0
        }
    ]
}

let kill_tracker:StatTracking[] = make_enemy_stat()
let wound_tracker: StatTracking[] = make_enemy_stat()

let enemy_attack_cooldown_tick: TickTracking = start_tick_track(reset_enemy_attack_cooldown)
enemy_attack_cooldown_tick.rate = 2
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
let hero_dodge_distance = 12
let hero_dodge_heal = 0
let hero_auto_collect_chance: number = 0
let hero_gem_collect_radius: number = 24
let hero_food_heal = 20

let gem_bonus_xp = 0
let weapon_pushback = 0
let aura_weapon: Sprite = null
let upgrade_menu: miniMenu.MenuSprite = null

let cat_inside_chest = false
let cat_out_of_chest = false

/*
MAIN MENU
*/

let main_menu: miniMenu.MenuSprite = null
let seen_intro: boolean = false

function start_main_menu() {
    scene.setBackgroundImage(assets.image`title-background`)
    let title_text = sprites.create(assets.image`title-text`, SpriteKind.NonInteractive)    
    game.setDialogFrame(assets.image`dialog frame`)
    main_menu = miniMenu.createMenu(
        miniMenu.createMenuItem("START   "),
        miniMenu.createMenuItem("THE STORY   "),
        miniMenu.createMenuItem("HOW TO PLAY   ")
    )
    main_menu.z = 1000
    main_menu.setFrame(assets.image`dialog frame`)
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
        switch(selectedIndex) {
            case 0:
                if (info.highScore() == 0 && !seen_intro) {
                    show_intro()
                }
                scene.setBackgroundColor(12)
                setup_game()
                choose_upgrade("STARTING WEAPON")
                break
            case 1:
                show_intro()
                start_main_menu()
                break
            case 2:
                game.showLongText("Move to avoid monsters.\n \nLet your weapons auto attack.\n \nCollect gems and treasures to level up your weapons. \n \nDefeat all monsters to win!", DialogLayout.Full)
                start_main_menu()
                break
        }
    })
}

function show_intro() {
    game.showLongText(
        "You are Sophie, the brave knight!\n" +
        "An ancient evil haunts the castle.\n" +
        "Save the kingdom from the mosters.\n" +
        "Enter the castle and lift its curse!", DialogLayout.Bottom)
    seen_intro = true
}

controller.left.onEvent(ControllerButtonEvent.Pressed, () => { hero_angle = 180 })
controller.right.onEvent(ControllerButtonEvent.Pressed, () => { hero_angle = 0 })
controller.up.onEvent(ControllerButtonEvent.Pressed, () => { hero_angle = 270 })
controller.down.onEvent(ControllerButtonEvent.Pressed, () => { hero_angle = 90 })

/*
UPGRADES
*/

function get_random_upgrade (message: string) {
    let upgrade_list = custom.get_upgrade_choices(1)
    if (upgrade_list.length > 0) {
        let next_upgrade = upgrade_list.pop()
        game.showLongText(message, DialogLayout.Bottom)
        game.showLongText(next_upgrade, DialogLayout.Bottom)
        perform_upgrade(custom.get_upgrade(next_upgrade))
    } else {
        game.showLongText("You found gold coins!", DialogLayout.Bottom)
        info.changeScoreBy(100)
    }
}

function choose_upgrade(title: string) {
    let upgrade_list = custom.get_upgrade_choices(3)
    if (upgrade_list.length > 0) {
        pause_the_game()
        effects.confetti.startScreenEffect()
        upgrade_menu = miniMenu.createMenuFromArray(custom.convert_string_array_to_mini_menu_items(upgrade_list))
        upgrade_menu.z = 1000
        upgrade_menu.setTitle(title)
        upgrade_menu.setMenuStyleProperty(miniMenu.MenuStyleProperty.Width, scene.screenWidth() - 20)
        upgrade_menu.setFrame(assets.image`dialog frame`)
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
        game.showLongText(
            "You reached level " + hero_level + "!\n" +
            "You are now slightly tougher.", DialogLayout.Bottom)
        hero_health.max += 10
        hero_health.value += 10
    }
}

// CONTAINS GAME DESIGN
function setup_upgrade_menu() {
    custom.add_upgrade_to_list("CROSS", assets.image`icon-cross`, "throw 3 crosses", "WEAPON")
    spray_spawn_count = 0
    spray_speed = 120
    spray_spawn_tick.rate = 6
    spray_damage = 10
    custom.add_upgrade_to_list("CROSS 2", assets.image`icon-cross`, "+1 cross", "CROSS") // 10-40
    custom.add_upgrade_to_list("CROSS 3", assets.image`icon-cross`, "x1.5 damage", "CROSS 2") // 15-60
    custom.add_upgrade_to_list("CROSS 4", assets.image`icon-cross`, "+1 cross", "CROSS 3") // 15-75
    custom.add_upgrade_to_list("CROSS 5", assets.image`icon-cross`, "x2 damage", "CROSS 4") // 30-150

    custom.add_upgrade_to_list("SPARK", assets.image`icon-spark`, "auto aim missile", "WEAPON")
    tracer_spawn_count = 0
    tracer_speed = 90
    tracer_spawn_tick.rate = 8
    tracer_damage = 10
    custom.add_upgrade_to_list("SPARK 2", assets.image`icon-spark`, "x1.5 damage", "SPARK") // 15 * .75
    custom.add_upgrade_to_list("SPARK 3", assets.image`icon-spark`, "x1.25 attack speed", "SPARK 2") // 15
    custom.add_upgrade_to_list("SPARK 4", assets.image`icon-spark`, "x2 damage", "SPARK 3") // 30
    custom.add_upgrade_to_list("SPARK 5", assets.image`icon-spark`, "+1 spark", "SPARK 4") // 30-60

    custom.add_upgrade_to_list("FIREBALL", assets.image`icon-fireball`, "explode on impact", "WEAPON")
    exploder_spawn_count = 0
    exploder_speed = 80
    exploder_duration = 750
    exploder_spawn_tick.rate = 10
    exploder_projectile_damage = 0
    exploder_explosion_damage = 30
    exploder_explosion_scale = 1.0
    custom.add_upgrade_to_list("FIREBALL 2", assets.image`icon-fireball`, "x2 damage", "FIREBALL") // 60 *.6
    custom.add_upgrade_to_list("FIREBALL 3", assets.image`icon-fireball`, "x1.5 radius", "FIREBALL 2") // 60 *.6
    custom.add_upgrade_to_list("FIREBALL 4", assets.image`icon-fireball`, "x1.5 speed", "FIREBALL 3") // 60 *.6
    custom.add_upgrade_to_list("FIREBALL 5", assets.image`icon-fireball`, "x3 damage", "FIREBALL 4") // 180 *.6

    custom.add_upgrade_to_list("SPELLBOOK", assets.image`icon-book`, "circles to protect", "WEAPON")
    orbit_spawn_count = 0
    orbit_spawn_tick.rate = 18
    orbit_angular_speed = 4
    orbit_distance = 30
    orbit_duration = 3000
    orbit_damage = 12
    custom.add_upgrade_to_list("SPELLBOOK 2", assets.image`icon-book`, "x1.5 damage", "SPELLBOOK") // 18-36 *.33
    custom.add_upgrade_to_list("SPELLBOOK 3", assets.image`icon-book`, "+1 book", "SPELLBOOK 2") // 18-54 *.33
    custom.add_upgrade_to_list("SPELLBOOK 4", assets.image`icon-book`, "x1.5 speed", "SPELLBOOK 3") // 
    custom.add_upgrade_to_list("SPELLBOOK 5", assets.image`icon-book`, "+2 book", "SPELLBOOK 4") // 24-90 *.33

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
    custom.add_upgrade_to_list("HOLY WATER 5", assets.image`icon-water`, "+1 vial", "HOLY WATER 4") // 

    custom.add_upgrade_to_list("LIFE SHIELD", assets.image`icon-shield`, "x3 item healing", "ACCESSORY")
    custom.add_upgrade_to_list("LIFE SHIELD 2", assets.image`icon-shield`, "x1.5 max HP", "LIFE SHIELD")
    custom.add_upgrade_to_list("LIFE SHIELD 3", assets.image`icon-shield`, "+4 HP per second", "LIFE SHIELD 2")

    custom.add_upgrade_to_list("GEM PRISM", assets.image`icon-prism`, "x1.5 pickup range", "ACCESSORY")
    custom.add_upgrade_to_list("GEM PRISM 2", assets.image`icon-prism`, "absorb gems every 10s", "GEM PRISM")
    custom.add_upgrade_to_list("GEM PRISM 3", assets.image`icon-prism`, "+1 XP per gem", "GEM PRISM 2")

    custom.add_upgrade_to_list("PHOENIX FEATHER", assets.image`icon-wing`, "x1.1 move and dodge", "ACCESSORY")
    custom.add_upgrade_to_list("PHOENIX FEATHER 2", assets.image`icon-wing`, "x1.2 move and dodge", "PHOENIX FEATHER")
    custom.add_upgrade_to_list("PHOENIX FEATHER 3", assets.image`icon-wing`, "+15 HP on dodge", "PHOENIX FEATHER 2")

    custom.add_upgrade_to_list("FLASH FLASK", assets.image`icon-flask`, "x1.1 all attack speed", "ACCESSORY")
    custom.add_upgrade_to_list("FLASH FLASK 2", assets.image`icon-flask`, "x1.2 all attack speed", "FLASH FLASK")
    custom.add_upgrade_to_list("FLASH FLASK 3", assets.image`icon-flask`, "+1 spell weapons", "FLASH FLASK 2")
    // spellbook, spark, fireball

    custom.add_upgrade_to_list("POWER CRYSTAL", assets.image`icon-crystal`, "x1.1 all damage", "ACCESSORY")
    custom.add_upgrade_to_list("POWER CRYSTAL 2", assets.image`icon-crystal`, "x1.2 all damage", "POWER CRYSTAL")
    custom.add_upgrade_to_list("POWER CRYSTAL 3", assets.image`icon-crystal`, "+weapon pushback", "POWER CRYSTAL 2")
    // cross, spark, spellbook, fireball (negative)

    custom.add_upgrade_to_list("AURA RING", assets.image`icon-ring`, "x1.2 all radius", "ACCESSORY")
    custom.add_upgrade_to_list("AURA RING 2", assets.image`icon-ring`, "x1.2 all radius", "AURA RING")
    custom.add_upgrade_to_list("AURA RING 3", assets.image`icon-ring`, "x1.5 radius damage", "AURA RING 2")
    // holy water, fireball, divine aura

    custom.add_upgrade_to_list("BLESSED CUP", assets.image`icon-cup`, "+2 HP per second", "ACCESSORY")
    custom.add_upgrade_to_list("BLESSED CUP 2", assets.image`icon-cup`, "x1.1 holy damage", "BLESSED CUP")
    custom.add_upgrade_to_list("BLESSED CUP 3", assets.image`icon-cup`, "x1.5 holy intensity", "BLESSED CUP 2")
    // holy water, cross, divine aura
}

// CONTAINS GAME DESIGN
function perform_upgrade(name: string) {
    switch(name) {
        case "LIFE SHIELD":
            hero_food_heal *= 3
            break
        case "LIFE SHIELD 2":
            hero_health.max *= 1.5
            break
        case "LIFE SHIELD 3":
            hero_regen += 4
            break

        case "FLASH FLASK":
            spray_spawn_tick.rate *= 0.9
            tracer_spawn_tick.rate *= 0.9
            exploder_spawn_tick.rate *= 0.9
            orbit_spawn_tick.rate *= 0.9
            molotov_spawn_tick.rate *= 0.9
            break
        case "FLASH FLASK 2":
            spray_spawn_tick.rate *= 0.8
            tracer_spawn_tick.rate *= 0.8
            exploder_spawn_tick.rate *= 0.8
            orbit_spawn_tick.rate *= 0.8
            molotov_spawn_tick.rate *= 0.8
            break
        case "FLASH FLASK 3":
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
            weapon_pushback = 40
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
            exploder_explosion_damage *= 1.5
            aura_tick_damage *= 1.5
            molotov_damage *= 1.5
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

        case "PHOENIX FEATHER":
            hero_speed += 10
            hero_dodge += 10
            adjust_hero_speed()
            break
        case "PHOENIX FEATHER 2":
            hero_speed += 20
            hero_dodge += 20
            adjust_hero_speed()
            break
        case "PHOENIX FEATHER 3":
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
            molotov_flame_duration *= 1.5
            aura_aoe_tick.rate *= 0.5
            spray_speed *= 1.2
            break

        case "CROSS":
            spray_spawn_count += 3
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
            exploder_spawn_count += 1
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
            exploder_projectile_damage *= 3
            exploder_explosion_damage *= 3
            break

        case "SPELLBOOK":
            orbit_spawn_count += 2
            fire_on_next_tick(orbit_spawn_tick)
            break
        case "SPELLBOOK 2":
            orbit_damage *= 1.5
            break
        case "SPELLBOOK 3":
            orbit_spawn_count += 1
            break
        case "SPELLBOOK 4":
            orbit_angular_speed *= 1.5
            break
        case "SPELLBOOK 5":
            orbit_spawn_count += 2
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
            molotov_spawn_count += 1
            break
    }
    redraw_upgrades()
}

function redraw_upgrades() {
    sprites.destroyAllSpritesOfKind(SpriteKind.UpgradeIcons)
    let icon_position = 7
    for (let icon of custom.get_obtained_upgrade_icons()) {
        let upgrade_icon_sprite = sprites.create(icon, SpriteKind.UpgradeIcons)
        upgrade_icon_sprite.x = icon_position
        upgrade_icon_sprite.y = 7
        upgrade_icon_sprite.setFlag(SpriteFlag.RelativeToCamera, true)
        upgrade_icon_sprite.z = 1000
        icon_position += 12
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
        show_stats()
        game.over(false, effects.splatter)
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
            custom.add_wave_data(2, 3, "KNIGHT")
            custom.add_wave_data(4, 3, "KNIGHT")
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
            custom.add_wave_data(2, 3, "ZOMBIE")
            custom.add_wave_data(3, 3, "GHOST")
            custom.add_wave_data(4, 3, "LAVA ZOMBIE")
            custom.add_wave_data(5, 1, "ZOMBIE")
            break
        case 13:
            custom.add_wave_data(1, 1, "LAVA ZOMBIE")
            custom.add_wave_data(5, 1, "LAVA ZOMBIE")
            break
        case 14:
            custom.reset_wave_data()
            custom.add_wave_data(1, 2, "LAVA ZOMBIE")
            custom.add_wave_data(2, 1, "CAPTAIN")
            custom.add_wave_data(3, 3, "MEAN SPIRIT")
            custom.add_wave_data(4, 1, "CAPTAIN")
            custom.add_wave_data(5, 2, "LAVA ZOMBIE")
            break
        case 15:
            custom.add_wave_data(1, 1, "LAVA ZOMBIE")
            custom.add_wave_data(2, 2, "KNIGHT")
            custom.add_wave_data(3, 2, "GHOST")
            custom.add_wave_data(4, 2, "KNIGHT")
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
        case 18:
        case 19:
            custom.add_wave_data(1, 1, "TOUGH SLIME")
            custom.add_wave_data(2, 1, "TOUGH SLIME")
            custom.add_wave_data(3, 1, "TOUGH SLIME")
            custom.add_wave_data(4, 1, "TOUGH SLIME")
            custom.add_wave_data(5, 1, "TOUGH SLIME")
            break


        case 20:
            custom.reset_wave_data()
            custom.add_wave_data(1, 2, "ZOMBIE")
            custom.add_wave_data(2, 2, "SLIME")
            custom.add_wave_data(3, 2, "GHOST")
            custom.add_wave_data(4, 2, "KNIGHT")
            custom.add_wave_data(5, 2, "TOUGH SLIME")
            break

            
        default:
            if(enemy_phase >= 20) {
                enemy_extra_difficulty += 1

                const dice_roll_enemy = Math.pickRandom([
                    "LAVA ZOMBIE",
                    "CAPTAIN",
                    "MEAN SPIRIT",
                ])
                const dice_roll_wave = Math.randomRange(1, 5)
                if(custom.get_wave_enemy_count(dice_roll_wave) < MAX_ENEMIES) {
                    custom.add_wave_data(dice_roll_wave, 1, dice_roll_enemy)
                }

                if(enemy_phase % 2 == 0 && cat_out_of_chest) {
                    const dice_roll_boss = Math.pickRandom([
                        "SKELETON MAGE",
                        "SLIME KING",
                        "TROLL"
                    ])
                    spawn_enemy(dice_roll_boss)
                }
            }
            break
    }
}

function spawn_enemy(name: string) {
    const enemies: Sprite[] = sprites.allOfKind(SpriteKind.Enemy)
    if (enemies.length >= MAX_ENEMIES) {
        const destroy_candidate = enemies.reduce((farthest, target) => custom.get_distance_between(target, hero) > custom.get_distance_between(farthest, hero) ? target : farthest, enemies[0])
        if (sprites.readDataBoolean(destroy_candidate, "boss")) {
            custom.move_sprite_off_camera(destroy_candidate)
        } else {
            destroy_candidate.destroy()
        }
    }

    // CONTAINS GAME DESIGN
    let new_enemy: Sprite = null
    if (name == "ZOMBIE") {
        new_enemy = sprites.create(assets.image`zombie`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 12, 10, 25, 1)
    } else if (name == "LAVA ZOMBIE") {
        new_enemy = sprites.create(assets.image`lava-zombie`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 90, 20, 30, 2)
    } else if (name == "MUMMY") {
        new_enemy = sprites.create(assets.image`mummy`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 30, 10, 20, 1)
    } else if (name == "KNIGHT") {
        new_enemy = sprites.create(assets.image`knight`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 40, 15, 30, 1)
        sprites.setDataBoolean(new_enemy, "multi_hit", true)
    } else if (name == "CAPTAIN") {
        new_enemy = sprites.create(assets.image`captain`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 120, 30, 25, 2)
        sprites.setDataBoolean(new_enemy, "multi_hit", true)
    } else if (name == "GHOST") {
        new_enemy = sprites.create(assets.image`ghost`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 30, 15, 40, 1)
    } else if (name == "MEAN SPIRIT") {
        new_enemy = sprites.create(assets.image`mourner`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 60, 15, 40, 2)
    } else if (name == "SKELETON MAGE") {
        new_enemy = sprites.create(assets.image`skeleton-mage`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 350, 30, 25, 3)
        sprites.setDataBoolean(new_enemy, "multi_hit", true)
        sprites.setDataBoolean(new_enemy, "boss", true)
    } else if (name == "SLIME") {
        new_enemy = sprites.create(assets.image`slime`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 24, 15, 20, 1)
    } else if (name == "TOUGH SLIME") {
        new_enemy = sprites.create(assets.image`tough-slime`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 48, 20, 30, 1)
    } else if (name == "SLIME KING") {
        new_enemy = sprites.create(assets.image`slime-king`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 800, 30, 35, 3)
        sprites.setDataBoolean(new_enemy, "multi_hit", true)
        sprites.setDataBoolean(new_enemy, "boss", true)
    } else if (name == "TROLL") {
        new_enemy = sprites.create(assets.image`troll`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 2000, 50, 30, 3)
        sprites.setDataBoolean(new_enemy, "multi_hit", true)
        sprites.setDataBoolean(new_enemy, "boss", true)
    }
    custom.move_sprite_off_camera(new_enemy)
}

function setup_enemy(enemy: Sprite, name: string, health: number, damage: number, speed: number, drop_type: number) {
    sprites.setDataString(enemy, "name", name)
    sprites.setDataNumber(enemy, "health", health * (1.0 + enemy_extra_difficulty * ENEMY_HEALTH_SCALE))
    sprites.setDataNumber(enemy, "damage", damage * (1.0 + enemy_extra_difficulty * ENEMY_DAMAGE_SCALE))
    sprites.setDataNumber(enemy, "drop_type", drop_type)
    sprites.setDataNumber(enemy, "speed", speed * (1.0 + enemy_extra_difficulty * ENEMY_SPEED_SCALE))
    enemy.follow(hero, speed, ENEMY_TURN_RATE)
    sprites.setDataBoolean(enemy, "boss", false)
    sprites.setDataBoolean(enemy, "multi_hit", false)
    sprites.setDataBoolean(enemy, "attack_cooldown", false)
    enemy.z = 50
    enemy.setFlag(SpriteFlag.GhostThroughWalls, true)
}

/*
ENEMY EVENTS
*/

function move_hero_to_dodge(target:Sprite) {
    let shadow = sprites.create(assets.image`hero-shadow`, SpriteKind.NonInteractive)
    custom.move_sprite_on_top_of_another(shadow, hero)
    shadow.destroy(effects.disintegrate, 500)
    custom.aim_projectile_at_sprite(hero, target, AimType.velocity, hero_dodge_distance)
    hero.x += -hero.vx
    hero.y += -hero.vy
    hero.vx = 0
    hero.vy = 0
    hero_health.value += hero_dodge_heal
}

function wound_hero(target:Sprite) {
    hero_health.value -= sprites.readDataNumber(target, "damage")
    wound_tracker.find(value => value.name == sprites.readDataString(target, "name")).total += sprites.readDataNumber(target, "damage")
    scene.cameraShake(Math.constrain(Math.floor(sprites.readDataNumber(target, "damage") / hero_health.max * 16), 1, 8), 250)
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    if (sprites.readDataBoolean(otherSprite, "multi_hit")) {
        if (!(sprites.readDataBoolean(otherSprite, "attack_cooldown"))) {
            if(!Math.percentChance(hero_dodge)) {
                wound_hero(otherSprite)
            } else {
                move_hero_to_dodge(otherSprite)
            }
            sprites.setDataBoolean(otherSprite, "attack_cooldown", true)
        }
    } else {
        if (!Math.percentChance(hero_dodge)) {
            wound_hero(otherSprite)
            otherSprite.destroy()
         } else {
            move_hero_to_dodge(otherSprite)
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
            cat.follow(hero, 80)
            custom.move_sprite_on_top_of_another(cat, otherSprite)
        } else {
            get_random_upgrade("You found treasure!")
        }
    }
    otherSprite.destroy()
})

scene.onOverlapTile(SpriteKind.Player, assets.tile`door-open-mid`, () => {
    game.splash("YOU HAVE LIFTED THE CURSE!")
    show_stats()
    game.over(true, effects.blizzard)
})

scene.onHitWall(SpriteKind.Explosive, function (sprite, location) {
    sprite.destroy()
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
    hero.z = 100
    tiles.placeOnRandomTile(hero, sprites.dungeon.floorLight5)
    scene.cameraFollowSprite(hero)
    hero_health = statusbars.create(20, 4, StatusBarKind.Health)
    hero_health.attachToSprite(hero, 4, 0)
    hero_health.max = 200
    hero_health.value = 200
    hero_health.setColor(7, 2)
    hero_health.z = hero.z + 1
    hero_xp = statusbars.create(scene.screenWidth() - 40, 5, StatusBarKind.Experience)
    hero_xp.setLabel("EXP", 12)
    hero_xp.positionDirection(CollisionDirection.Bottom)
    hero_xp.setOffsetPadding(0, 4)
    hero_xp.max = 10
    hero_xp_increment = 5
    hero_xp.value = 0
    hero_xp.setColor(9, 15, 15)
    hero_xp.setStatusBarFlag(StatusBarFlag.SmoothTransition, false)
    hero_xp.z = 1000
    info.setScore(0)
    controller.moveSprite(hero)
    setup_upgrade_menu()
    enemy_phase = 0
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
    controller.moveSprite(hero)
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
    controller.moveSprite(hero, 0, 0)
}

/*
WEAPONS
*/
function drop_gem(enemy:Sprite, image:Image, xp:number): Sprite {
    let new_drop = sprites.create(image, SpriteKind.PickUp)
    new_drop.z = 30
    sprites.setDataNumber(new_drop, "xp", xp)
    custom.move_sprite_on_top_of_another(new_drop, enemy)
    if(Math.percentChance(hero_auto_collect_chance)) {
        new_drop.follow(hero, GEM_FLY_SPEED)
    }
    return new_drop
}

function deal_enemy_damage(sx: number, sy: number, enemy: Sprite, name: string, damage: number, pushback: number) {
    const drops: Sprite[] = sprites.allOfKind(SpriteKind.PickUp)
    let new_drop: Sprite = null
    if (drops.length >= MAX_DROPS) {
        drops.reduce((farthest, drop) => custom.get_distance_between(drop, hero) > custom.get_distance_between(farthest, hero) ? drop : farthest, drops[0]).destroy()
    }
    sprites.changeDataNumberBy(enemy, "health", -damage)
    damage_tracker.find(value => value.name == name).total += damage

    if(pushback > 0) {
        let pushback_scale = pushback / Math.sqrt((enemy.x - sx) * (enemy.x - sx) + (enemy.y -sy) * (enemy.y -sy))
        enemy.vx += (enemy.x - sx) * pushback_scale
        enemy.vy += (enemy.y - sy) * pushback_scale
    }

    if (sprites.readDataNumber(enemy, "health") <= 0) {
        kill_tracker.find(tracker => tracker.name == sprites.readDataString(enemy, "name")).total += 1
        if (sprites.readDataNumber(enemy, "drop_type") > 0
            && Math.percentChance(HEAL_DROP_CHANCE)
            && sprites.allOfKind(SpriteKind.Food).length < MAX_FOOD) {
            let new_food = sprites.create(assets.image`health-potion`, SpriteKind.Food)
            new_food.z = 30
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
            new_treasure.z = 30
            custom.move_sprite_on_top_of_another(new_treasure, enemy)
        }
        enemy.destroy(effects.disintegrate)
    }
}

function create_new_aura() {
    aura_weapon = sprites.create(assets.image`area32x32`, SpriteKind.NonInteractive)
    aura_weapon.z = hero.z
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

function damage_enemies_in_aura(aura: Sprite, pushback: number) {
    for (let aura_target of sprites.allOfKind(SpriteKind.Enemy)) {
        if ((aura_target.width + aura_target.height) / 4 + (aura.width / 2) > custom.get_distance_between(aura, aura_target)) {
            deal_enemy_damage(aura.x, aura.y, aura_target, sprites.readDataString(aura, "name"), sprites.readDataNumber(aura, "damage"), pushback)
        }
    }
}

function adjust_aura_scale() {
    aura_weapon.scale = aura_scale
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
    flame_weapon.z = 25
    flame_weapon.setPosition(sprite.x, sprite.y)
    flame_weapon.scale = molotov_flame_scale
    flame_weapon.lifespan = molotov_flame_duration
    sprites.setDataNumber(flame_weapon, "damage", molotov_tick_damage)
    sprites.setDataString(flame_weapon, "name", "HOLY WATER")
})

sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(otherSprite.x - sprite.vx, otherSprite.y - sprite.vy, otherSprite, sprites.readDataString(sprite, "name"), sprites.readDataNumber(sprite, "damage"), weapon_pushback)
    sprite.destroy()
})

sprites.onDestroyed(SpriteKind.Explosive, function (sprite) {
    let explosion = sprites.create(assets.image`area32x32`, SpriteKind.NonInteractive)
    animation.runImageAnimation(
        explosion,
        assets.animation`explosion-anim`,
        100,
        false
    )
    explosion.setPosition(sprite.x, sprite.y)
    explosion.z = hero.z
    explosion.scale = exploder_explosion_scale
    explosion.lifespan = 500
    sprites.setDataNumber(explosion, "damage", exploder_explosion_damage)
    sprites.setDataString(explosion, "name", "FIREBALL")
    damage_enemies_in_aura(explosion, weapon_pushback)
})

sprites.onOverlap(SpriteKind.Orbital, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(hero.x, hero.y, otherSprite, sprites.readDataString(sprite, "name"), sprites.readDataNumber(sprite, "damage"), weapon_pushback)
    sprite.destroy()
})

sprites.onOverlap(SpriteKind.Explosive, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(0, 0, otherSprite, sprites.readDataString(sprite, "name"), sprites.readDataNumber(sprite, "damage"), 0)
    sprite.destroy()
})

/*
TICK EVENTS
*/

function spawn_exploder() {
    if(exploder_spawn_count > 0) {
        for (let index = 0; index < exploder_spawn_count + bonus_magic_spawn; index++) {
            let new_weapon = sprites.create(assets.image`fireball`, SpriteKind.Explosive)
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
        new_weapon.lifespan = randint(molotov_duration_min, molotov_duration_max)
        custom.aim_projectile_at_angle(
        new_weapon,
        randint(0, 360),
        AimType.velocity,
        molotov_speed,
        hero
        )
        new_weapon.setFlag(SpriteFlag.DestroyOnWall, true)
    }
}

function spawn_spray() {
    let spray_angle = hero_angle
    spray_angle -= spray_spawn_count * 15 / 2
    spray_angle += Math.randomRange(-15, 15)
    let weapon_image:Image = null

    for (let index = 0; index < spray_spawn_count; index++) {
        let new_weapon = sprites.create(assets.image`weapon-cross`, SpriteKind.Projectile)
        custom.aim_projectile_at_angle(
        new_weapon,
        spray_angle,
        AimType.velocity,
        spray_speed,
        hero
        )
        new_weapon.setFlag(SpriteFlag.AutoDestroy, true)
        new_weapon.lifespan = DEFAULT_WEAPON_LIFESPAN
        sprites.setDataString(new_weapon, "name", "CROSS")
        sprites.setDataNumber(new_weapon, "damage", spray_damage)
        spray_angle += 15
    }
}


function spawn_orbit() {
    // this check is necessary to prevent a divided by 0 error
    if (orbit_spawn_count > 0) {
        sprites.destroyAllSpritesOfKind(SpriteKind.Orbital)
        let spawn_angle_spacing = 360 / (orbit_spawn_count + bonus_magic_spawn)
        for (let orbit = 0; orbit < orbit_spawn_count + bonus_magic_spawn; orbit++) {
            let new_weapon = sprites.create(assets.image`weapon-book`, SpriteKind.Orbital)
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
game.onUpdate(function () {
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
        for (let pickup of sprites.allOfKind(SpriteKind.PickUp)) {
            if (custom.get_distance_between(pickup, hero) < hero.width / 2) {
                hero_xp.value += sprites.readDataNumber(pickup, "xp") + gem_bonus_xp
                info.changeScoreBy(sprites.readDataNumber(pickup, "xp") + gem_bonus_xp)
                pickup.destroy()
            } else if (custom.get_distance_between(pickup, hero) < hero_gem_collect_radius) {
                pickup.follow(hero, GEM_FLY_SPEED)
            }
        }

        for (let pickup of sprites.allOfKind(SpriteKind.Food)) {
            if (custom.get_distance_between(pickup, hero) < hero.width / 2 + pickup.width / 2) {
                hero_health.value += hero_food_heal
                pickup.destroy()
            }
        }
    }

    if (aura_spawn_count > 0) {
        aura_weapon.setPosition(hero.x, hero.y)
    }
})

function show_stats() {
    game.showLongText(`LV ${hero_level}` + "\n \n" + damage_tracker.filter(value => value.total > 0).map(value => `${value.name}: ${Math.floor(value.total)}`).join("\n"), DialogLayout.Full)
    game.showLongText(`UPGRADES` + "\n \n" + custom.get_obtained_highest_upgrade_names().join("\n"), DialogLayout.Full)
    game.showLongText(`ENEMY PHASE ${enemy_phase} LV+ ${enemy_extra_difficulty}` + "\n \n" + kill_tracker.filter(value => value.total > 0).map(value => `${value.name}: ${Math.floor(value.total)}`).join("\n"), DialogLayout.Full)
    game.showLongText(`DAMAGE TAKEN\n \n` + wound_tracker.filter(value => value.total > 0).map(value => `${value.name}: ${Math.floor(value.total)}`).join("\n"), DialogLayout.Full)
    pause(100)
}

controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
    if(custom.game_state_is(GameState.normal)) {
        show_stats()
    }
})

/*
MAIN
*/
start_main_menu()