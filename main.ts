namespace SpriteKind {
    export const Orbital = SpriteKind.create()
    export const Visuals = SpriteKind.create()
    export const Molotov = SpriteKind.create()
    export const Explosion = SpriteKind.create()
    export const Aura = SpriteKind.create()
}
namespace StatusBarKind {
    export const Experience = StatusBarKind.create()
}
sprites.onOverlap(SpriteKind.Explosion, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(otherSprite, sprites.readDataNumber(sprite, "damage"))
    sprite.destroy()
})
scene.onHitWall(SpriteKind.Explosion, function (sprite, location) {
    sprite.destroy()
})
function spawn_enemy_wave () {
    list = custom.get_wave_enemy_list()
    for (let value of list) {
        if (value == "zombie") {
            new_enemy = sprites.create(assets.image`ghost`, SpriteKind.Enemy)
            setup_enemy(new_enemy, value, 10, 1, 20)
            custom.move_sprite_off_camera(new_enemy)
        }
    }
    custom.advance_wave()
}
sprites.onDestroyed(SpriteKind.Molotov, function (sprite) {
    flame_weapon = sprites.create(assets.image`flame`, SpriteKind.Aura)
    flame_weapon.z = 25
    flame_weapon.setPosition(sprite.x, sprite.y)
    flame_weapon.lifespan = molotov_flame_duration
    sprites.setDataNumber(flame_weapon, "damage", molotov_tick_damage)
})
function deal_enemy_damage (enemy: Sprite, damage: number) {
    sprites.changeDataNumberBy(enemy, "health", damage * -1)
    if (sprites.readDataNumber(enemy, "health") <= 0) {
        enemy.destroy()
    }
}
function create_new_aura () {
    aura_weapon = sprites.create(assets.image`aura`, SpriteKind.Visuals)
    aura_weapon.setPosition(hero.x, hero.y)
    aura_weapon.z = hero.z - 2
    sprites.setDataNumber(aura_weapon, "damage", aura_tick_damage)
}
statusbars.onZero(StatusBarKind.Health, function (status) {
    if (status == hero_health) {
    	
    }
})
function damage_enemies_in_aura (aura: Sprite) {
    for (let value of sprites.allOfKind(SpriteKind.Enemy)) {
        if (value.overlapsWith(aura)) {
            deal_enemy_damage(value, sprites.readDataNumber(aura, "damage"))
        }
    }
}
scene.onHitWall(SpriteKind.Molotov, function (sprite, location) {
    sprite.destroy()
})
function setup_enemy (enemy: Sprite, name: string, health: number, damage: number, speed: number) {
    sprites.setDataString(enemy, "name", name)
    sprites.setDataNumber(enemy, "health", health)
    sprites.setDataNumber(enemy, "damage", damage)
    enemy.follow(hero, speed)
    enemy.z = 50
}
scene.onHitWall(SpriteKind.Projectile, function (sprite, location) {
    sprite.destroy()
})
sprites.onDestroyed(SpriteKind.Explosion, function (sprite) {
    flame_weapon = sprites.create(assets.image`explosion`, SpriteKind.Visuals)
    flame_weapon.setPosition(sprite.x, sprite.y)
    flame_weapon.lifespan = 500
    sprites.setDataNumber(flame_weapon, "damage", exploder_explosion_damage)
    damage_enemies_in_aura(flame_weapon)
})
function create_upgrade_menu () {
    default_weapon_duration = 1000
    custom.add_upgrade_to_list("Daggers", "throw 3 daggers")
    spray_spawn_count = 0
    spray_speed = 100
    spray_firing_rate = 500
    spray_damage = 10
    custom.add_upgrade_to_list("Spark", "auto aim missile")
    tracer_spawn_count = 0
    tracer_speed = 100
    tracer_firing_rate = 500
    tracer_damage = 10
    custom.add_upgrade_to_list("Fireball", "explode on impact")
    exploder_spawn_count = 1
    exploder_speed = 100
    exploder_firing_rate = 1000
    exploder_projectile_damage = 10
    exploder_explosion_damage = 10
    custom.add_upgrade_to_list("Bible", "circles the player")
    orbit_spawn_count = 0
    orbit_angular_speed = 5
    orbit_distance = 30
    orbit_duration = 2000
    orbit_refresh_rate = 5000
    orbit_damage = 10
    custom.add_upgrade_to_list("Garlic", "damage aura")
    aura_spawn_count = 0
    aura_tick_rate = 500
    aura_tick_damage = 5
    custom.add_upgrade_to_list("Holy Water", "toss and burn")
    molotov_spawn_count = 0
    molotov_speed = 200
    molotov_damage = 10
    molotov_duration_min = 150
    molotov_duration_max = 350
    molotov_flame_duration = 5000
    molotov_firing_rate = 8000
    molotov_tick_rate = 500
    molotov_tick_damage = 5
}
function create_enemy_waves () {
    custom.reset_wave_data()
    custom.add_wave_data(4, 1, "zombie")
}
function setup_game () {
    tiles.setCurrentTilemap(tilemap`dungeon`)
    hero = sprites.create(assets.image`survivor`, SpriteKind.Player)
    hero.z = 100
    tiles.placeOnRandomTile(hero, sprites.dungeon.floorLightMoss)
    scene.cameraFollowSprite(hero)
    hero_health = statusbars.create(20, 4, StatusBarKind.Health)
    hero_health.attachToSprite(hero, 4, 0)
    hero_health.max = 10
    hero_health.value = 10
    hero_health.setColor(7, 2)
    hero_health.z = hero.z + 1
    hero_xp = statusbars.create(scene.screenWidth() - 40, 5, StatusBarKind.Experience)
    hero_xp.setLabel("EXP")
    hero_xp.positionDirection(CollisionDirection.Bottom)
    hero_xp.setOffsetPadding(0, 4)
    hero_xp.max = 10
    hero_xp.value = 0
    hero_xp.setColor(9, 15)
    controller.moveSprite(hero)
    create_upgrade_menu()
    create_enemy_waves()
    game_is_ready = 1
}
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    deal_enemy_damage(otherSprite, sprites.readDataNumber(sprite, "damage"))
    sprite.destroy()
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    hero_health.value += sprites.readDataNumber(otherSprite, "damage") * -1
    otherSprite.destroy()
})
let spawn_angle_spacing = 0
let new_weapon: Sprite = null
let game_is_ready = 0
let hero_xp: StatusBarSprite = null
let molotov_firing_rate = 0
let molotov_duration_max = 0
let molotov_duration_min = 0
let molotov_speed = 0
let molotov_spawn_count = 0
let aura_tick_rate = 0
let aura_spawn_count = 0
let orbit_refresh_rate = 0
let orbit_duration = 0
let orbit_distance = 0
let orbit_angular_speed = 0
let orbit_spawn_count = 0
let exploder_firing_rate = 0
let exploder_speed = 0
let exploder_spawn_count = 0
let tracer_firing_rate = 0
let tracer_speed = 0
let tracer_spawn_count = 0
let spray_damage = 0
let spray_firing_rate = 0
let spray_speed = 0
let spray_spawn_count = 0
let default_weapon_duration = 0
let hero_health: StatusBarSprite = null
let hero: Sprite = null
let aura_weapon: Sprite = null
let molotov_flame_duration = 0
let flame_weapon: Sprite = null
let new_enemy: Sprite = null
let list: string[] = []
let molotov_damage = 0
let molotov_tick_rate = 0
let molotov_tick_damage = 0
let aura_tick_damage = 0
let orbit_damage = 0
let exploder_projectile_damage = 0
let exploder_explosion_damage = 0
let tracer_damage = 0
tracer_damage = 0
exploder_explosion_damage = 0
exploder_projectile_damage = 0
orbit_damage = 0
aura_tick_damage = 0
molotov_tick_damage = 0
molotov_tick_rate = 0
molotov_damage = 0
setup_game()
game.onUpdate(function () {
    if (aura_spawn_count > 0) {
        aura_weapon.setPosition(hero.x, hero.y)
    }
})
game.onUpdateInterval(exploder_firing_rate, function () {
    if (game_is_ready == 1 && exploder_spawn_count > 0) {
        new_weapon = sprites.create(assets.image`fireball`, SpriteKind.Explosion)
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
game.onUpdateInterval(50, function () {
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
})
game.onUpdateInterval(aura_tick_rate, function () {
    if (game_is_ready == 1 && aura_spawn_count > 0) {
        damage_enemies_in_aura(aura_weapon)
    }
})
game.onUpdateInterval(molotov_firing_rate, function () {
    if (game_is_ready == 1 && molotov_spawn_count > 0) {
        new_weapon = sprites.create(assets.image`molotov`, SpriteKind.Molotov)
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
    if (game_is_ready == 1 && spray_spawn_count > 0) {
        for (let index = 0; index < spray_spawn_count; index++) {
            new_weapon = sprites.create(assets.image`dagger`, SpriteKind.Projectile)
            custom.aim_projectile_at_angle(
            new_weapon,
            randint(0, 360),
            AimType.velocity,
            spray_speed,
            hero
            )
            new_weapon.lifespan = default_weapon_duration
            sprites.setDataNumber(new_weapon, "damage", spray_damage)
        }
    }
})
game.onUpdateInterval(500, function () {
    if (game_is_ready == 1) {
        spawn_enemy_wave()
    }
})
game.onUpdateInterval(orbit_refresh_rate, function () {
    if (game_is_ready == 1 && orbit_spawn_count > 0) {
        sprites.destroyAllSpritesOfKind(SpriteKind.Orbital)
        spawn_angle_spacing = 360 / orbit_spawn_count
        for (let index2 = 0; index2 <= orbit_spawn_count - 1; index2++) {
            new_weapon = sprites.create(assets.image`orbiter`, SpriteKind.Orbital)
            new_weapon.lifespan = orbit_duration
            sprites.setDataNumber(new_weapon, "angle", spawn_angle_spacing * index2)
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
    if (game_is_ready == 1 && aura_spawn_count > 0) {
        for (let value of sprites.allOfKind(SpriteKind.Aura)) {
            damage_enemies_in_aura(value)
        }
    }
})
game.onUpdateInterval(tracer_firing_rate, function () {
    if (game_is_ready == 1 && tracer_spawn_count > 0) {
        new_weapon = sprites.create(assets.image`tracer`, SpriteKind.Projectile)
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
