namespace SpriteKind {
    export const Orbital = SpriteKind.create()
    export const Visuals = SpriteKind.create()
    export const Molotov = SpriteKind.create()
    export const Explosion = SpriteKind.create()
    export const Aura = SpriteKind.create()
    export const Pickup = SpriteKind.create()
    export const Treasure = SpriteKind.create()
    export const UpgradeIcons = SpriteKind.create()
}
namespace StatusBarKind {
    export const Experience = StatusBarKind.create()
}
const MAX_DROPS = 8
const MAX_ENEMIES = 8


function get_random_upgrade (message: string) {
    let upgrade_list = custom.get_upgrade_choices(1)
    if (upgrade_list.length > 0) {
        let next_upgrade = upgrade_list.pop()
        game.setDialogFrame(assets.image`dark dialog frame`)
        game.showLongText(message, DialogLayout.Bottom)
        game.showLongText("You obtained " + next_upgrade, DialogLayout.Bottom)
        perform_upgrade(custom.get_upgrade(next_upgrade))
    }
}


sprites.onOverlap(SpriteKind.Player, SpriteKind.Pickup, function (sprite, otherSprite) {
    hero_xp.value += sprites.readDataNumber(otherSprite, "xp")
    otherSprite.destroy()
})
sprites.onOverlap(SpriteKind.Explosion, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(otherSprite, sprites.readDataNumber(sprite, "damage"))
    sprite.destroy()
})
function unpause_the_game () {
    for (let upgrade_icon of sprites.allOfKind(SpriteKind.Enemy)) {
        upgrade_icon.follow(hero, sprites.readDataNumber(upgrade_icon, "speed"))
    }
    controller.moveSprite(hero)
    custom.set_game_state(GameState.normal)
}
function pause_the_game () {
    custom.set_game_state(GameState.menu)
    sprites.destroyAllSpritesOfKind(SpriteKind.Pickup)
    for (let value2 of sprites.allOfKind(SpriteKind.Enemy)) {
        value2.follow(hero, 0)
    }
    sprites.destroyAllSpritesOfKind(SpriteKind.Orbital)
    sprites.destroyAllSpritesOfKind(SpriteKind.Aura)
    sprites.destroyAllSpritesOfKind(SpriteKind.Molotov)
    sprites.destroyAllSpritesOfKind(SpriteKind.Explosion)
    sprites.destroyAllSpritesOfKind(SpriteKind.Projectile)
    controller.moveSprite(hero, 0, 0)
}
sprites.onOverlap(SpriteKind.Player, SpriteKind.Treasure, function (sprite, otherSprite) {
    get_random_upgrade("Congrats! You found a treasure!")
    otherSprite.destroy()
})
scene.onHitWall(SpriteKind.Explosion, function (sprite, location) {
    sprite.destroy()
})
function spawn_enemy_wave () {
    let list = custom.get_wave_enemy_list()
    for (let next_enemy of list) {
        spawn_enemy(next_enemy)
    }
    custom.advance_wave()
}
sprites.onDestroyed(SpriteKind.Molotov, function (sprite) {
    let flame_weapon = sprites.create(assets.image`area32x32`, SpriteKind.Aura)
    animation.runImageAnimation(
    flame_weapon,
    assets.animation`myAnim`,
    150,
    true
    )
    flame_weapon.z = 25
    flame_weapon.setPosition(sprite.x, sprite.y)
    flame_weapon.lifespan = molotov_flame_duration
    sprites.setDataNumber(flame_weapon, "damage", molotov_tick_damage)
})
function deal_enemy_damage (enemy: Sprite, damage: number) {
    const drops:Sprite[] = sprites.allOfKind(SpriteKind.Pickup)
    let new_drop:Sprite = null
    if(drops.length >= MAX_DROPS) {
        drops.reduce((farthest, drop) => custom.get_distance_between(drop, hero) > custom.get_distance_between(farthest, hero) ? drop : farthest, drops[0]).destroy()
    }
    sprites.changeDataNumberBy(enemy, "health", damage * -1)
    if (sprites.readDataNumber(enemy, "health") <= 0) {
        if (sprites.readDataNumber(enemy, "drop_type") == 1) {
            new_drop = sprites.create(assets.image`blue gem`, SpriteKind.Pickup)
            new_drop.lifespan = 8000
            sprites.setDataNumber(new_drop, "xp", 2)
            custom.move_sprite_on_top_of_another(new_drop, enemy)
        } else if (sprites.readDataNumber(enemy, "drop_type") == 2) {
            new_drop = sprites.create(assets.image`green gem`, SpriteKind.Pickup)
            sprites.setDataNumber(new_drop, "xp", 4)
            custom.move_sprite_on_top_of_another(new_drop, enemy)
        } else if (sprites.readDataNumber(enemy, "drop_type") == 3) {
            new_drop = sprites.create(assets.image`red gem`, SpriteKind.Pickup)
            sprites.setDataNumber(new_drop, "xp", 8)
            custom.aim_projectile_at_angle(
            new_drop,
            randint(0, 360),
            AimType.position,
            randint(10, 20),
            enemy
            )
            new_drop = sprites.create(assets.image`treasure`, SpriteKind.Treasure)
            custom.move_sprite_on_top_of_another(new_drop, enemy)
        }
        enemy.destroy()
    }
}
function perform_upgrade (name: string) {
    if (name == "Daggers") {
        spray_spawn_count += 3
    } else if (name == "Spark") {
        tracer_spawn_count += 1
    } else if (name == "Fireball") {
        exploder_spawn_count += 1
    } else if (name == "Bible") {
        orbit_spawn_count += 3
    } else if (name == "Divine Aura") {
        aura_spawn_count += 1
        create_new_aura()
    } else if (name == "Holy Water") {
        molotov_spawn_count += 1
    } else {
    	
    }
    redraw_upgrades()
}
function choose_upgrade (title: string) {
    let upgrade_list = custom.get_upgrade_choices(3)
    if (upgrade_list.length > 0) {
        pause_the_game()
        upgrade_menu = miniMenu.createMenuFromArray(custom.convert_string_array_to_mini_menu_items(upgrade_list))
        upgrade_menu.z = 1000
        upgrade_menu.setTitle(title)
        upgrade_menu.setMenuStyleProperty(miniMenu.MenuStyleProperty.Width, scene.screenWidth() - 20)
        upgrade_menu.setFrame(assets.image`dark dialog frame`)
        upgrade_menu.setMenuStyleProperty(miniMenu.MenuStyleProperty.Height, 32 + 14 * upgrade_list.length)
        upgrade_menu.setStyleProperty(miniMenu.StyleKind.Default, miniMenu.StyleProperty.Padding, 2)
        upgrade_menu.setStyleProperty(miniMenu.StyleKind.Selected, miniMenu.StyleProperty.Background, 12)
        upgrade_menu.setStyleProperty(miniMenu.StyleKind.Title, miniMenu.StyleProperty.Padding, 4)
        custom.move_sprite_on_top_of_another(upgrade_menu, hero)
        upgrade_menu.onButtonPressed(controller.A, function (selection, selectedIndex) {
            upgrade_menu.close()
            let next_upgrade = custom.get_upgrade(selection)
            perform_upgrade(next_upgrade)
            unpause_the_game()
        })
    }
}
function create_new_aura () {
    aura_weapon = sprites.create(assets.image`area32x32`, SpriteKind.Visuals)
    aura_weapon.z = hero.z
    animation.runImageAnimation(
    aura_weapon,
    assets.animation`divine-aura`,
    500,
    true
    )
    custom.move_sprite_on_top_of_another(aura_weapon, hero)
    sprites.setDataNumber(aura_weapon, "damage", aura_tick_damage)
}
statusbars.onStatusReached(StatusBarKind.Experience, statusbars.StatusComparison.GTE, statusbars.ComparisonType.Percentage, 100, function (status) {
    status.value = 0
    status.max += 10
    choose_upgrade("Pick Upgrade")
})
statusbars.onZero(StatusBarKind.Health, function (status) {
    if (status == hero_health) {
    	
    }
})
function damage_enemies_in_aura (aura: Sprite) {
    for (let aura_target of sprites.allOfKind(SpriteKind.Enemy)) {
        if (aura_target.overlapsWith(aura)) {
            deal_enemy_damage(aura_target, sprites.readDataNumber(aura, "damage"))
        }
    }
}
scene.onHitWall(SpriteKind.Molotov, function (sprite, location) {
    sprite.destroy()
})
function redraw_upgrades () {
    sprites.destroyAllSpritesOfKind(SpriteKind.UpgradeIcons)
    icon_position = 7
    for (let upgrade_icon2 of custom.get_obtained_upgrade_icons()) {
        upgrade_icon_sprite = sprites.create(upgrade_icon2, SpriteKind.UpgradeIcons)
        sprites.setDataNumber(upgrade_icon_sprite, "sx", icon_position)
        sprites.setDataNumber(upgrade_icon_sprite, "sy", 7)
        upgrade_icon_sprite.z = 1000
        icon_position += 12
    }
}
function setup_enemy (enemy: Sprite, name: string, health: number, damage: number, speed: number, drop_type: number) {
    sprites.setDataString(enemy, "name", name)
    sprites.setDataNumber(enemy, "health", health)
    sprites.setDataNumber(enemy, "damage", damage)
    sprites.setDataNumber(enemy, "drop_type", drop_type)
    sprites.setDataNumber(enemy, "speed", speed)
    enemy.follow(hero, speed)
    sprites.setDataBoolean(enemy, "boss", false)
    sprites.setDataBoolean(enemy, "attack_cooldown", false)
    enemy.z = 50
}
function spawn_enemy (name: string) {
    const enemies: Sprite[] = sprites.allOfKind(SpriteKind.Enemy)
    if (enemies.length >= MAX_ENEMIES) {
        const destroy_candidate = enemies.reduce((farthest, target) => custom.get_distance_between(target, hero) > custom.get_distance_between(farthest, hero) ? target : farthest, enemies[0])
        if(sprites.readDataBoolean(destroy_candidate, "boss")) {
            custom.move_sprite_off_camera(destroy_candidate)
        } else {
            destroy_candidate.destroy()
        }
    }
    if (name == "zombie") {
        new_enemy = sprites.create(assets.image`zombie`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 10, 10, 20, 1)
    } else if (name == "skeleton") {
        new_enemy = sprites.create(assets.image`skeleton`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 20, 10, 30, 2)
    } else if (name == "troll") {
        new_enemy = sprites.create(assets.image`troll`, SpriteKind.Enemy)
        setup_enemy(new_enemy, name, 150, 15, 25, 3)
        sprites.setDataBoolean(new_enemy, "boss", true)
    } else {
    	
    }
    custom.move_sprite_off_camera(new_enemy)
}
scene.onHitWall(SpriteKind.Projectile, function (sprite, location) {
    sprite.destroy()
})
sprites.onDestroyed(SpriteKind.Explosion, function (sprite) {
    let flame_weapon = sprites.create(assets.image`area32x32`, SpriteKind.Visuals)
    animation.runImageAnimation(
    flame_weapon,
    assets.animation`explosion-anim`,
    100,
    false
    )
    flame_weapon.setPosition(sprite.x, sprite.y)
    flame_weapon.lifespan = 500
    sprites.setDataNumber(flame_weapon, "damage", exploder_explosion_damage)
    damage_enemies_in_aura(flame_weapon)
})
sprites.onOverlap(SpriteKind.Orbital, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(otherSprite, sprites.readDataNumber(sprite, "damage"))
    sprite.destroy()
})
function setup_upgrade_menu () {
    default_weapon_duration = 1000
    custom.add_upgrade_to_list("Daggers", assets.image`icon-dagger`, "throw 3 daggers")
spray_spawn_count = 0
    spray_speed = 120
    spray_firing_rate = 2000
    spray_damage = 12
    custom.add_upgrade_to_list("Spark", assets.image`icon-spark`, "auto aim missile")
tracer_spawn_count = 0
    tracer_speed = 100
    tracer_firing_rate = 1500
    tracer_damage = 10
    custom.add_upgrade_to_list("Fireball", assets.image`icon-fireball`, "explode on impact")
exploder_spawn_count = 0
    exploder_speed = 80
    exploder_firing_rate = 1500
    exploder_projectile_damage = 10
    exploder_explosion_damage = 10
    custom.add_upgrade_to_list("Bible", assets.image`icon-bible`, "circles to protect")
orbit_spawn_count = 0
    orbit_angular_speed = 6
    orbit_distance = 30
    orbit_duration = 3000
    orbit_refresh_rate = 5000
    orbit_damage = 15
    custom.add_upgrade_to_list("Divine Aura", assets.image`icon-aura`, "damage aura")
aura_spawn_count = 0
    aura_tick_rate = 500
    aura_tick_damage = 4
    custom.add_upgrade_to_list("Holy Water", assets.image`icon-water`, "toss and burn")
molotov_spawn_count = 0
    molotov_speed = 100
    molotov_damage = 10
    molotov_duration_min = 300
    molotov_duration_max = 700
    molotov_flame_duration = 5000
    molotov_firing_rate = 8000
    molotov_tick_rate = 500
    molotov_tick_damage = 5
}
function create_enemy_waves () {
    if (level_enemy_phase == 0) {
        custom.reset_wave_data()
        custom.add_wave_data(4, 2, "zombie")
    } else if (level_enemy_phase == 1) {
    	
    } else if (level_enemy_phase == 2) {
        custom.add_wave_data(2, 2, "zombie")
    } else if (level_enemy_phase == 3) {
        custom.add_wave_data(1, 1, "skeleton")
        custom.add_wave_data(3, 1, "skeleton")
    } else if (level_enemy_phase == 4) {
        custom.reset_wave_data()
        custom.add_wave_data(4, 2, "zombie")
        spawn_enemy("troll")
    } else {
    	
    }
}
function setup_game () {
    tiles.setCurrentTilemap(tilemap`dungeon`)
    hero = sprites.create(assets.image`survivor`, SpriteKind.Player)
    animation.runImageAnimation(
    hero,
    assets.animation`hero-anim`,
    400,
    true
    )
    hero.z = 100
    tiles.placeOnRandomTile(hero, sprites.dungeon.floorLightMoss)
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
    hero_xp.value = 0
    hero_xp.setColor(9, 15)
    hero_xp.setStatusBarFlag(StatusBarFlag.SmoothTransition, false)
    controller.moveSprite(hero)
    setup_upgrade_menu()
    level_enemy_phase = 0
    create_enemy_waves()
    custom.set_game_state(GameState.normal)
}
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(otherSprite, sprites.readDataNumber(sprite, "damage"))
    sprite.destroy()
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    if (sprites.readDataBoolean(otherSprite, "boss")) {
        if (!(sprites.readDataBoolean(otherSprite, "attack_cooldown"))) {
            hero_health.value += sprites.readDataNumber(otherSprite, "damage") * -1
            sprites.setDataBoolean(otherSprite, "attack_cooldown", true)
        }
    } else {
        hero_health.value += sprites.readDataNumber(otherSprite, "damage") * -1
        otherSprite.destroy()
    }
})
let level_enemy_phase = 0
let molotov_tick_rate = 0
let molotov_firing_rate = 0
let molotov_duration_max = 0
let molotov_duration_min = 0
let molotov_damage = 0
let molotov_speed = 0
let aura_tick_rate = 0
let orbit_damage = 0
let orbit_refresh_rate = 0
let orbit_duration = 0
let orbit_distance = 0
let orbit_angular_speed = 0
let exploder_projectile_damage = 0
let exploder_firing_rate = 0
let exploder_speed = 0
let tracer_damage = 0
let tracer_firing_rate = 0
let tracer_speed = 0
let spray_damage = 0
let spray_firing_rate = 0
let spray_speed = 0
let default_weapon_duration = 0
let exploder_explosion_damage = 0
let new_enemy: Sprite = null
let upgrade_icon_sprite: Sprite = null
let icon_position = 0
let hero_health: StatusBarSprite = null
let aura_tick_damage = 0
let aura_weapon: Sprite = null
let upgrade_menu: miniMenu.MenuSprite = null
let molotov_spawn_count = 0
let aura_spawn_count = 0
let orbit_spawn_count = 0
let exploder_spawn_count = 0
let tracer_spawn_count = 0
let spray_spawn_count = 0
let molotov_tick_damage = 0
let molotov_flame_duration = 0
let hero: Sprite = null
let hero_xp: StatusBarSprite = null

setup_game()
choose_upgrade("Starting Weapon")


game.onUpdate(function () {
    for (let upgrade_icon_sprite2 of sprites.allOfKind(SpriteKind.UpgradeIcons)) {
        custom.move_sprite_relative_to_camera(
        upgrade_icon_sprite2,
        sprites.readDataNumber(upgrade_icon_sprite2, "sx"),
        sprites.readDataNumber(upgrade_icon_sprite2, "sy"),
        hero
        )
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
    if (aura_spawn_count > 0) {
        aura_weapon.setPosition(hero.x, hero.y)
    }
})
game.onUpdateInterval(exploder_firing_rate, function () {
    if (custom.game_state_is(GameState.normal) && exploder_spawn_count > 0) {
        let new_weapon = sprites.create(assets.image`fireball`, SpriteKind.Explosion)
        custom.aim_projectile_at_angle(
        new_weapon,
        randint(0, 360),
        AimType.velocity,
        exploder_speed,
        hero
        )
        new_weapon.lifespan = default_weapon_duration
        sprites.setDataNumber(new_weapon, "damage", exploder_projectile_damage)
    }
})
game.onUpdateInterval(aura_tick_rate, function () {
    if (custom.game_state_is(GameState.normal) && aura_spawn_count > 0) {
        damage_enemies_in_aura(aura_weapon)
    }
})
game.onUpdateInterval(molotov_firing_rate, function () {
    if (custom.game_state_is(GameState.normal) && molotov_spawn_count > 0) {
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
})
game.onUpdateInterval(spray_firing_rate, function () {
    if (custom.game_state_is(GameState.normal) && spray_spawn_count > 0) {
        let spray_angle = randint(0, 360)
        for (let index = 0; index < spray_spawn_count; index++) {
            let new_weapon = sprites.create(assets.image`weapon-dagger`, SpriteKind.Projectile)
            custom.aim_projectile_at_angle(
            new_weapon,
            spray_angle,
            AimType.velocity,
            spray_speed,
            hero
            )
            new_weapon.lifespan = default_weapon_duration
            sprites.setDataNumber(new_weapon, "damage", spray_damage)
            spray_angle += 15
        }
    }
})
game.onUpdateInterval(30000, function () {
    if (custom.game_state_is(GameState.normal)) {
        level_enemy_phase += 1
        create_enemy_waves()
    }
})
game.onUpdateInterval(500, function () {
    if (custom.game_state_is(GameState.normal)) {
        spawn_enemy_wave()
    }
    for (let value5 of sprites.allOfKind(SpriteKind.Enemy)) {
        sprites.setDataBoolean(value5, "attack_cooldown", false)
    }
})
game.onUpdateInterval(orbit_refresh_rate, function () {
    if (custom.game_state_is(GameState.normal) && orbit_spawn_count > 0) {
        sprites.destroyAllSpritesOfKind(SpriteKind.Orbital)
        let spawn_angle_spacing = 360 / orbit_spawn_count
        for (let orbit = 0; orbit <= orbit_spawn_count - 1; orbit++) {
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
})
game.onUpdateInterval(molotov_tick_rate, function () {
    if (custom.game_state_is(GameState.normal) && molotov_spawn_count > 0) {
        for (let molotov_fire_weapon of sprites.allOfKind(SpriteKind.Aura)) {
            damage_enemies_in_aura(molotov_fire_weapon)
        }
    }
})
game.onUpdateInterval(tracer_firing_rate, function () {
    if (custom.game_state_is(GameState.normal) && tracer_spawn_count > 0) {
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
        new_weapon.lifespan = default_weapon_duration
        sprites.setDataNumber(new_weapon, "damage", tracer_damage)
    }
})
