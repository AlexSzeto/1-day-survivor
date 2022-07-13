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
const MAX_ENEMIES = 6
const DEFAULT_WEAPON_LIFESPAN = 800
const USE_FAST_DROP = true

const ENEMY_DAMAGE_SCALE = 0.1
const ENEMY_HEALTH_SCALE = 0.20
const ENEMY_SPEED_SCALE = 0.05

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
let aura_tick_pushback = 6

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
let hero_dodge_distance = 8

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
    scene.setBackgroundImage(assets.image`splash-screen`)
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
                game.showLongText("Your weapons auto attack. Move to avoid enemies. Collect gems to level up. Defeat the final boss and escape to win the game!", DialogLayout.Full)
                start_main_menu()
                break
        }
    })
}

function show_intro() {
    game.showLongText("An ancient evil haunts the castle. The king calls for help!", DialogLayout.Bottom)
    game.showLongText("You are Sophie, the brave knight, here to answer the call!", DialogLayout.Bottom)
    game.showLongText("As you enter the castle, the heavy doors close behind you...", DialogLayout.Bottom)
    game.showLongText("The only way out now is to defeat the ancient evil. Good luck!", DialogLayout.Bottom)
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
        game.showLongText("You found 100 gold!", DialogLayout.Bottom)
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
        game.showLongText("You reached level "+hero_level+"!", DialogLayout.Bottom)
        game.showLongText("A burst of energy heals you!", DialogLayout.Bottom)
        hero_health.value += 50
    }
}

// CONTAINS GAME DESIGN
function setup_upgrade_menu() {
    custom.add_upgrade_to_list("Daggers", assets.image`icon-dagger`, "throw 3 daggers", "Weapon")
    spray_spawn_count = 0
    spray_speed = 120
    spray_spawn_tick.rate = 6
    spray_damage = 8
    custom.add_upgrade_to_list("Daggers 2", assets.image`icon-dagger`, "+1 dagger", "Daggers")
    custom.add_upgrade_to_list("Daggers 3", assets.image`icon-dagger`, "x2 damage", "Daggers 2")
    custom.add_upgrade_to_list("Daggers 4", assets.image`icon-dagger`, "+1 dagger", "Daggers 3")
    custom.add_upgrade_to_list("Daggers 5", assets.image`icon-dagger`, "x2 pace", "Daggers 4")

    custom.add_upgrade_to_list("Spark", assets.image`icon-spark`, "auto aim missile", "Weapon")
    tracer_spawn_count = 0
    tracer_speed = 100
    tracer_spawn_tick.rate = 4
    tracer_damage = 12
    custom.add_upgrade_to_list("Spark 2", assets.image`icon-spark`, "x2 damage", "Spark")
    custom.add_upgrade_to_list("Spark 3", assets.image`icon-spark`, "x2 pace", "Spark 2")
    custom.add_upgrade_to_list("Spark 4", assets.image`icon-spark`, "x2 damage", "Spark 3")
    custom.add_upgrade_to_list("Spark 5", assets.image`icon-spark`, "+1 spark", "Spark 4")

    custom.add_upgrade_to_list("Fireball", assets.image`icon-fireball`, "explode on impact", "Weapon")
    exploder_spawn_count = 0
    exploder_speed = 80
    exploder_duration = 800
    exploder_spawn_tick.rate = 8
    exploder_projectile_damage = 0
    exploder_explosion_damage = 30
    exploder_explosion_scale = 1.0
    custom.add_upgrade_to_list("Fireball 2", assets.image`icon-fireball`, "x2 damage", "Fireball")
    custom.add_upgrade_to_list("Fireball 3", assets.image`icon-fireball`, "+50% radius", "Fireball 2")
    custom.add_upgrade_to_list("Fireball 4", assets.image`icon-fireball`, "x2 damage", "Fireball 3")
    custom.add_upgrade_to_list("Fireball 5", assets.image`icon-fireball`, "x2 pace", "Fireball 4")

    custom.add_upgrade_to_list("Spellbook", assets.image`icon-bible`, "circles to protect", "Weapon")
    orbit_spawn_count = 0
    orbit_spawn_tick.rate = 18
    orbit_angular_speed = 6
    orbit_distance = 30
    orbit_duration = 3000
    orbit_damage = 16
    custom.add_upgrade_to_list("Spellbook 2", assets.image`icon-bible`, "+50% damage", "Spellbook")
    custom.add_upgrade_to_list("Spellbook 3", assets.image`icon-bible`, "+1 book", "Spellbook 2")
    custom.add_upgrade_to_list("Spellbook 4", assets.image`icon-bible`, "+50% speed", "Spellbook 3")
    custom.add_upgrade_to_list("Spellbook 5", assets.image`icon-bible`, "+2 book", "Spellbook 4")

    custom.add_upgrade_to_list("Divine Aura", assets.image`icon-aura`, "damage aura", "Weapon")
    aura_spawn_count = 0
    aura_aoe_tick.rate = 2
    aura_tick_damage = 8
    aura_scale = 1.0
    custom.add_upgrade_to_list("Divine Aura 2", assets.image`icon-aura`, "x2 damage", "Divine Aura")
    custom.add_upgrade_to_list("Divine Aura 3", assets.image`icon-aura`, "+25% radius", "Divine Aura 2")
    custom.add_upgrade_to_list("Divine Aura 4", assets.image`icon-aura`, "x2 damage", "Divine Aura 3")
    custom.add_upgrade_to_list("Divine Aura 5", assets.image`icon-aura`, "+50% radius", "Divine Aura 4")

    custom.add_upgrade_to_list("Holy Water", assets.image`icon-water`, "toss and burn", "Weapon")
    molotov_spawn_count = 0
    molotov_speed = 100
    molotov_damage = 12
    molotov_duration_min = 300
    molotov_duration_max = 700
    molotov_flame_duration = 4000
    molotov_spawn_tick.rate = 24
    molotov_aoe_tick.rate = 2
    molotov_tick_damage = 6
    molotov_flame_scale = 1.0
    custom.add_upgrade_to_list("Holy Water 2", assets.image`icon-water`, "+50% duration", "Holy Water")
    custom.add_upgrade_to_list("Holy Water 3", assets.image`icon-water`, "+25% radius", "Holy Water 2")
    custom.add_upgrade_to_list("Holy Water 4", assets.image`icon-water`, "+1 vial", "Holy Water 3")
    custom.add_upgrade_to_list("Holy Water 5", assets.image`icon-water`, "x2 damage", "Holy Water 4")

    custom.add_upgrade_to_list("Life Shield", assets.image`icon-shield`, "+1 HP per second", "Armor")
    custom.add_upgrade_to_list("Life Shield 2", assets.image`icon-shield`, "+1 HP per second", "Life Shield")
    custom.add_upgrade_to_list("Life Shield 3", assets.image`icon-shield`, "+50% max HP", "Life Shield 2")

    custom.add_upgrade_to_list("Bottled Lightning", assets.image`icon-flask`, "+20% all pace", "Armor")
    custom.add_upgrade_to_list("Bottled Lightning 2", assets.image`icon-flask`, "+20% all pace", "Bottled Lightning")
    custom.add_upgrade_to_list("Bottled Lightning 3", assets.image`icon-flask`, "+1 magic weapons", "Bottled Lightning 2")

    custom.add_upgrade_to_list("Force Crystal", assets.image`icon-crystal`, "+20% all damage", "Armor")
    custom.add_upgrade_to_list("Force Crystal", assets.image`icon-crystal`, "+20% all damage", "Force Crystal")
    custom.add_upgrade_to_list("Force Crystal", assets.image`icon-crystal`, "+weapon pushback", "Force Crystal 2")

    custom.add_upgrade_to_list("Aura Ring", assets.image`icon-ring`, "+25% all radius", "Armor")
    custom.add_upgrade_to_list("Aura Ring", assets.image`icon-ring`, "+25% all radius", "Aura Ring")
    custom.add_upgrade_to_list("Aura Ring", assets.image`icon-ring`, "+40% radius damage", "Aura Ring 2")

    custom.add_upgrade_to_list("Gem Prism", assets.image`icon-prism`, "get gems every 16s", "Armor")
    custom.add_upgrade_to_list("Gem Prism", assets.image`icon-prism`, "get gems every 8s", "Gem Prism")
    custom.add_upgrade_to_list("Gem Prism", assets.image`icon-prism`, "+1 XP per gem", "Gem Prism 2")

    custom.add_upgrade_to_list("Phoenix Feather", assets.image`icon-wing`, "+20% move speed", "Armor")
    custom.add_upgrade_to_list("Phoenix Feather", assets.image`icon-wing`, "+20% move speed", "Phoenix Feather")
    custom.add_upgrade_to_list("Phoenix Feather", assets.image`icon-wing`, "+30% dodge", "Phoenix Feather 2")
}

// CONTAINS GAME DESIGN
function perform_upgrade(name: string) {
    switch(name) {
        case "Life Shield":
            hero_regen += 1
            break
        case "Life Shield 2":
            hero_regen += 1
            break
        case "Life Shield 3":
            hero_health.max *= 1.5
            break

        case "Bottled Lightning":
            spray_spawn_tick.rate *= 0.8
            tracer_spawn_tick.rate *= 0.8
            exploder_spawn_tick.rate *= 0.8
            orbit_spawn_tick.rate *= 0.8
            molotov_spawn_tick.rate *= 0.8
            break
        case "Bottled Lightning 2":
            spray_spawn_tick.rate *= 0.8
            tracer_spawn_tick.rate *= 0.8
            exploder_spawn_tick.rate *= 0.8
            orbit_spawn_tick.rate *= 0.8
            molotov_spawn_tick.rate *= 0.8
            break
        case "Bottled Lightning 3":
            bonus_magic_spawn = 1
            break

        case "Force Crystal":
            spray_damage *= 1.2
            tracer_damage *= 1.2
            exploder_projectile_damage *= 1.2
            exploder_explosion_damage *= 1.2
            aura_tick_damage *= 1.2
            orbit_damage *= 1.2
            molotov_damage *= 1.2
            break
        case "Force Crystal 2":
            spray_damage *= 1.2
            tracer_damage *= 1.2
            exploder_projectile_damage *= 1.2
            exploder_explosion_damage *= 1.2
            aura_tick_damage *= 1.2
            orbit_damage *= 1.2
            molotov_damage *= 1.2
            break
        case "Force Crystal 3":
            weapon_pushback = 24
            break

        case "Aura Ring":
            exploder_explosion_scale *= 1.25
            aura_scale *= 1.25
            molotov_flame_scale *= 1.25
            break
        case "Aura Ring 2":
            exploder_explosion_scale *= 1.25
            aura_scale *= 1.25
            molotov_flame_scale *= 1.25
            break
        case "Aura Ring 3":
            exploder_explosion_damage *= 1.2
            aura_tick_damage *= 1.2
            molotov_damage *= 1.2
            break

        case "Gem Prism":
            start_auto_collect()
            break
        case "Gem Prism 2":
            hero_auto_collect_tick.rate = 8 * 4
            break
        case "Gem Prism 3":
            gem_bonus_xp += 1
            break

        case "Phoenix Feather":
            hero_speed += 20
            adjust_hero_speed()
            break
        case "Phoenix Feather":
            hero_speed += 20
            adjust_hero_speed()
            break
        case "Phoenix Feather":
            hero_dodge = 30
            break

        case "Daggers":
            spray_spawn_count += 3
            fire_on_next_tick(spray_spawn_tick)
            break
        case "Daggers 2":
            spray_spawn_count += 1
            break
        case "Daggers 3":
            spray_damage *= 2
            break
        case "Daggers 4":
            spray_spawn_count += 1
            break
        case "Daggers 5":
            spray_spawn_tick.rate *= 0.5
            break

        case "Spark":
            tracer_spawn_count += 1
            fire_on_next_tick(tracer_spawn_tick)
            break
        case "Spark 2":
            tracer_damage *= 2
            break
        case "Spark 3":
            tracer_spawn_tick.rate *= 0.5
            break
        case "Spark 4":
            tracer_damage *= 2
            break
        case "Spark 5":
            tracer_spawn_count += 1
            break

        case "Fireball":
            exploder_spawn_count += 1
            fire_on_next_tick(exploder_spawn_tick)
            break
        case "Fireball 2":
            exploder_projectile_damage *= 2
            exploder_explosion_damage *= 2
            break
        case "Fireball 3":
            exploder_explosion_scale += 0.50
            break
        case "Fireball 4":
            exploder_projectile_damage *= 2
            exploder_explosion_damage *= 2
            break
        case "Fireball 5":
            exploder_spawn_tick.rate *= 0.5
            break

        case "Spellbook":
            orbit_spawn_count += 2
            fire_on_next_tick(orbit_spawn_tick)
            break
        case "Spellbook 2":
            orbit_damage *= 1.5
            break
        case "Spellbook 3":
            orbit_spawn_count += 1
            break
        case "Spellbook 4":
            orbit_angular_speed *= 1.5
            break
        case "Spellbook 5":
            orbit_spawn_count += 2
            break

        case "Divine Aura":
            aura_spawn_count += 1
            create_new_aura()
            break
        case "Divine Aura 2":
            aura_tick_damage *= 2
            break
        case "Divine Aura 3":
            aura_scale += 0.25
            adjust_aura_scale()
            break
        case "Divine Aura 4":
            aura_tick_damage *= 2
            break
        case "Divine Aura 5":
            aura_scale += 0.50
            adjust_aura_scale()
            break

        case "Holy Water":
            molotov_spawn_count += 1
            fire_on_next_tick(molotov_spawn_tick)
            break
        case "Holy Water 2":
            molotov_flame_duration *= 1.5
            break
        case "Holy Water 3":
            molotov_flame_scale += 0.25
            break
        case "Holy Water 4":
            molotov_spawn_count += 1
            break
        case "Holy Water 5":
            molotov_tick_damage *= 2
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
    choose_upgrade("You Reached Lv. " + hero_level + "!")
})

statusbars.onZero(StatusBarKind.Health, function (status) {
    if (status == hero_health) {
        game.over(false, effects.splatter)
    }
})

function start_auto_collect() {
    hero_auto_collect_tick = start_tick_track(auto_collect_all_gems, 16 * 4)
}

function auto_collect_all_gems() {
    for(let gem of sprites.allOfKind(SpriteKind.PickUp)) {
        gem.follow(hero, 200)
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
            custom.add_wave_data(1, 2, "zombie")
            break
        case 1:
            custom.add_wave_data(2, 1, "knight")
            custom.add_wave_data(3, 2, "zombie")
            break
        case 2:
            custom.add_wave_data(4, 1, "knight")
            custom.add_wave_data(5, 2, "zombie")
            break
        case 3:
            custom.reset_wave_data()
            custom.add_wave_data(3, 2, "zombie")
            spawn_enemy("skeleton-mage")
            break
        case 4:
            custom.reset_wave_data()
            custom.add_wave_data(2, 3, "zombie")
            custom.add_wave_data(4, 2, "knight")
            custom.add_wave_data(3, 1, "ghost")
            break
        case 5:
            custom.add_wave_data(3, 1, "captain")
            break
        case 6:
            custom.reset_wave_data()
            custom.add_wave_data(1, 1, "ghost")
            custom.add_wave_data(5, 1, "ghost")
            break
        case 7:
            custom.reset_wave_data()
            custom.add_wave_data(1, 1, "slime")
            custom.add_wave_data(2, 1, "slime")
            custom.add_wave_data(3, 1, "slime")
            custom.add_wave_data(4, 1, "slime")
            custom.add_wave_data(5, 1, "slime")
            spawn_enemy("slime-king")
            break
        case 8:
            custom.reset_wave_data()
            custom.add_wave_data(1, 1, "lava-zombie")
            custom.add_wave_data(2, 3, "zombie")
            custom.add_wave_data(3, 1, "mourner")
            custom.add_wave_data(4, 3, "lava-zombie")
            custom.add_wave_data(5, 1, "zombie")
            break
        case 9:
            custom.reset_wave_data()
            custom.add_wave_data(1, 1, "knight")
            custom.add_wave_data(3, 2, "knight")
            custom.add_wave_data(5, 1, "knight")
            custom.add_wave_data(2, 1, "captain")
            custom.add_wave_data(4, 1, "captain")
            break
        case 10:
            custom.reset_wave_data()
            custom.add_wave_data(1, 1, "lava-zombie")
            custom.add_wave_data(3, 1, "mourner")
            custom.add_wave_data(5, 1, "lava-zombie")
            custom.add_wave_data(2, 1, "captain")
            custom.add_wave_data(4, 1, "captain")
        case 11:
            custom.add_wave_data(1, 2, "knight")
            custom.add_wave_data(3, 1, "captain")
            custom.add_wave_data(5, 2, "knight")
            spawn_enemy("troll")
            cat_inside_chest = true
            break
        case 12:
            custom.add_wave_data(2, 1, "captain")
            custom.add_wave_data(3, 1, "mourner")
            custom.add_wave_data(4, 1, "captain")
            break
        case 15:
            custom.reset_wave_data()
            custom.add_wave_data(1, 1, "slime")
            custom.add_wave_data(2, 1, "slime")
            custom.add_wave_data(3, 1, "slime")
            custom.add_wave_data(3, 1, "ghost")
            custom.add_wave_data(4, 1, "slime")
            custom.add_wave_data(5, 1, "slime")
            break
        default:
            if(enemy_phase < 16) {
                break
            }
            enemy_extra_difficulty += 1
            const dice_roll_enemy = Math.pickRandom([
                "lava-zombie",
                "captain",
                "mourner",
            ])
            const dice_roll_wave = Math.randomRange(1, 5)
            custom.add_wave_data(dice_roll_wave, 1, dice_roll_enemy)
            if(enemy_phase % 2 == 0 && cat_out_of_chest) {
                const dice_roll_boss = Math.pickRandom([
                    "skeleton-mage",
                    "slime-king",
                    "troll"
                ])
                spawn_enemy(dice_roll_boss)
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
    if (name == "zombie") {
        new_enemy = sprites.create(assets.image`zombie`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 10, 10, 20, 1)
    } else if (name == "lava-zombie") {
        new_enemy = sprites.create(assets.image`lava-zombie`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 60, 20, 18, 2)
    } else if (name == "knight") {
        new_enemy = sprites.create(assets.image`knight`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 40, 15, 25, 1)
        sprites.setDataBoolean(new_enemy, "multi_hit", true)
    } else if (name == "captain") {
        new_enemy = sprites.create(assets.image`captain`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 120, 30, 22, 2)
        sprites.setDataBoolean(new_enemy, "multi_hit", true)
    } else if (name == "ghost") {
        new_enemy = sprites.create(assets.image`ghost`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 10, 15, 35, 1)
    } else if (name == "mourner") {
        new_enemy = sprites.create(assets.image`mourner`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 10, 30, 50, 2)
    } else if (name == "skeleton-mage") {
        new_enemy = sprites.create(assets.image`skeleton-mage`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 360, 30, 18, 3)
        sprites.setDataBoolean(new_enemy, "multi_hit", true)
        sprites.setDataBoolean(new_enemy, "boss", true)
    } else if (name == "slime") {
        new_enemy = sprites.create(assets.image`slime`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 20, 15, 12, 1)
    } else if (name == "slime-king") {
        new_enemy = sprites.create(assets.image`slime-king`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 800, 30, 30, 3)
        sprites.setDataBoolean(new_enemy, "multi_hit", true)
        sprites.setDataBoolean(new_enemy, "boss", true)
    } else if (name == "troll") {
        new_enemy = sprites.create(assets.image`troll`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 1200, 40, 20, 3)
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
    enemy.follow(hero, speed)
    sprites.setDataBoolean(enemy, "boss", false)
    sprites.setDataBoolean(enemy, "multi_hit", false)
    sprites.setDataBoolean(enemy, "attack_cooldown", false)
    enemy.z = 50
    enemy.setFlag(SpriteFlag.GhostThroughWalls, true)
}

/*
ENEMY EVENTS
*/

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    if (sprites.readDataBoolean(otherSprite, "multi_hit")) {
        if (!(sprites.readDataBoolean(otherSprite, "attack_cooldown"))) {
            if(!Math.percentChance(hero_dodge)) {
                hero_health.value -= sprites.readDataNumber(otherSprite, "damage")
                scene.cameraShake(Math.max(4, Math.floor(sprites.readDataNumber(otherSprite, "damage") / hero_health.max * 8)), 500)
                sprites.setDataBoolean(otherSprite, "attack_cooldown", true)
            } else {
                custom.aim_projectile_at_sprite(hero, otherSprite, AimType.velocity, hero_dodge_distance)
                hero.x += -hero.vx
                hero.y += -hero.vy
                hero.vx = 0
                hero.vy = 0
            }
        }
    } else {
        if (!Math.percentChance(hero_dodge)) {
            hero_health.value -= sprites.readDataNumber(otherSprite, "damage")
            scene.cameraShake(Math.max(4, Math.floor(sprites.readDataNumber(otherSprite, "damage") / hero_health.max * 8)), 500)
            otherSprite.destroy()
         } else {
            custom.aim_projectile_at_sprite(hero, otherSprite, AimType.velocity, hero_dodge_distance)
            hero.x += -hero.vx
            hero.y += -hero.vy
            hero.vx = 0
            hero.vy = 0
        }
    }
})

/*
PICKUPS
*/

/*
PICKUP EVENTS
*/

function give_gem_xp(sprite:Sprite, pickup:Sprite) {
    hero_xp.value += sprites.readDataNumber(pickup, "xp") + gem_bonus_xp
    info.changeScoreBy(sprites.readDataNumber(pickup, "xp") + gem_bonus_xp)
}

if(!USE_FAST_DROP) {
    sprites.onOverlap(SpriteKind.Player, SpriteKind.PickUp, function (sprite, otherSprite) {
        give_gem_xp(sprite, otherSprite)
        otherSprite.destroy()
    })
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.Treasure, function (sprite, otherSprite) {
    if(cat_inside_chest && !cat_out_of_chest) {
        cat_out_of_chest = true
        game.showLongText("You found the naughty cat, Jiji!", DialogLayout.Bottom)
        info.changeScoreBy(100)
        game.showLongText("Jiji summoned all the monsters. He was stuck in the chest and very scared!", DialogLayout.Bottom)
        game.showLongText("If you lead him out of the castle, the monsters should stop appearing.", DialogLayout.Bottom)
        game.showLongText("The doors to the north open. Time to leave the castle... or not?", DialogLayout.Bottom)
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
        get_random_upgrade("You found a treasure!")
    }
    otherSprite.destroy()
})

scene.onOverlapTile(SpriteKind.Player, assets.tile`door-open-mid`, () => {
    game.splash("YOU ESACPED THE CASTLE!")
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
    hero_xp.setLabel("EXP")
    hero_xp.positionDirection(CollisionDirection.Bottom)
    hero_xp.setOffsetPadding(0, 4)
    hero_xp.max = 10
    hero_xp_increment = 5
    hero_xp.value = 0
    hero_xp.setColor(9, 15, 15)
    hero_xp.setStatusBarFlag(StatusBarFlag.SmoothTransition, false)
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
        upgrade_icon.follow(hero, sprites.readDataNumber(upgrade_icon, "speed"))
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

function deal_enemy_damage(sx: number, sy: number, enemy: Sprite, damage: number, pushback: number) {
    const drops: Sprite[] = sprites.allOfKind(SpriteKind.PickUp)
    let new_drop: Sprite = null
    if (drops.length >= MAX_DROPS) {
        drops.reduce((farthest, drop) => custom.get_distance_between(drop, hero) > custom.get_distance_between(farthest, hero) ? drop : farthest, drops[0]).destroy()
    }
    sprites.changeDataNumberBy(enemy, "health", damage * -1)

    if(pushback > 0) {
        let pushback_scale = pushback / Math.sqrt((enemy.x - sx) * (enemy.x - sx) + (enemy.y -sy) * (enemy.y -sy))
        enemy.vx = (enemy.x - sx) * pushback_scale
        enemy.vy = (enemy.y - sy) * pushback_scale
    }

    if (sprites.readDataNumber(enemy, "health") <= 0) {
        if (sprites.readDataNumber(enemy, "drop_type") == 1) {
            new_drop = sprites.create(assets.image`blue gem`, SpriteKind.PickUp)
            new_drop.z = 30
            sprites.setDataNumber(new_drop, "xp", 2)
            custom.move_sprite_on_top_of_another(new_drop, enemy)
        } else if (sprites.readDataNumber(enemy, "drop_type") == 2) {
            new_drop = sprites.create(assets.image`green gem`, SpriteKind.PickUp)
            new_drop.z = 30
            sprites.setDataNumber(new_drop, "xp", 4)
            custom.move_sprite_on_top_of_another(new_drop, enemy)
        } else if (sprites.readDataNumber(enemy, "drop_type") == 3) {
            new_drop = sprites.create(assets.image`red gem`, SpriteKind.PickUp)
            new_drop.z = 30
            sprites.setDataNumber(new_drop, "xp", 16)
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
    sprites.setDataNumber(aura_weapon, "damage", aura_tick_damage)
}

function damage_enemies_in_aura(aura: Sprite, pushback: number) {
    for (let aura_target of sprites.allOfKind(SpriteKind.Enemy)) {
        if ((aura_target.width + aura_target.height) / 4 + (aura.width / 2) > custom.get_distance_between(aura, aura_target)) {
            deal_enemy_damage(aura.x, aura.y, aura_target, sprites.readDataNumber(aura, "damage"), pushback)
        }
    }
}

function adjust_aura_scale() {
    aura_weapon.scale = aura_scale
}

/*
WEAPONS EVENTS
*/

// PROJECTILE
scene.onHitWall(SpriteKind.Projectile, function (sprite, location) {
    sprite.destroy()
})

// MOLOTOV
scene.onHitWall(SpriteKind.Molotov, function (sprite, location) {
    sprite.destroy()
})

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
})

sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(otherSprite.x - sprite.vx, otherSprite.y - sprite.vy, otherSprite, sprites.readDataNumber(sprite, "damage"), weapon_pushback)
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
    damage_enemies_in_aura(explosion, weapon_pushback)
})

sprites.onOverlap(SpriteKind.Orbital, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(0,0, otherSprite, sprites.readDataNumber(sprite, "damage"), 0)
    sprite.destroy()
})

sprites.onOverlap(SpriteKind.Explosive, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(0, 0, otherSprite, sprites.readDataNumber(sprite, "damage"), 0)
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
    }
}

function spawn_spray() {
    let spray_angle = hero_angle
    spray_angle -= spray_spawn_count * 15 / 2
    spray_angle += Math.randomRange(-30, 30)
    let weapon_image:Image = null

    if (spray_angle < 90) {
        weapon_image = assets.image`weapon-dagger-se`
    } else if (spray_angle < 180) {
        weapon_image = assets.image`weapon-dagger-sw`
    } else if (spray_angle < 270) {
        weapon_image = assets.image`weapon-dagger-nw`
    } else {
        weapon_image = assets.image`weapon-dagger-ne`
    }
    for (let index = 0; index < spray_spawn_count; index++) {
        let new_weapon = sprites.create(weapon_image, SpriteKind.Projectile)
        custom.aim_projectile_at_angle(
        new_weapon,
        spray_angle,
        AimType.velocity,
        spray_speed,
        hero
        )
        new_weapon.lifespan = DEFAULT_WEAPON_LIFESPAN
        sprites.setDataNumber(new_weapon, "damage", spray_damage)
        spray_angle += 15
    }
}


function spawn_orbit() {
    // this check is necessary to prevent a divided by 0 error
    if (orbit_spawn_count > 0) {
        sprites.destroyAllSpritesOfKind(SpriteKind.Orbital)
        let spawn_angle_spacing = 360 / orbit_spawn_count
        for (let orbit = 0; orbit < orbit_spawn_count + bonus_magic_spawn; orbit++) {
            let new_weapon = sprites.create(assets.image`weapon-bible`, SpriteKind.Orbital)
            new_weapon.lifespan = orbit_duration
            sprites.setDataNumber(new_weapon, "angle", spawn_angle_spacing * orbit)
            custom.aim_projectile_at_angle(
            new_weapon,
            sprites.readDataNumber(new_weapon, "angle"),
            AimType.position,
            orbit_distance,
            hero
            )
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

    if( USE_FAST_DROP ) {
        for (let pickup of sprites.allOfKind(SpriteKind.PickUp)) {
            if (custom.get_distance_between(pickup, hero) < hero.width / 2 + pickup.width / 2) {
                give_gem_xp(hero, pickup)
                pickup.destroy()
            }
        }
    }

    if (aura_spawn_count > 0) {
        aura_weapon.setPosition(hero.x, hero.y)
    }
})

/*
MAIN
*/
start_main_menu()