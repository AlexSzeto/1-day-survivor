namespace SpriteKind {
    export const Orbital = SpriteKind.create()
    export const Visuals = SpriteKind.create()
    export const Molotov = SpriteKind.create()
    export const Explosion = SpriteKind.create()
}
namespace StatusBarKind {
    export const Experience = StatusBarKind.create()
}
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
    flame_weapon = sprites.createProjectileFromSprite(assets.image`flame`, sprite, 0, 0)
    flame_weapon.lifespan = molotov_flame_duration
})
function create_new_aura () {
    aura_weapon = sprites.create(assets.image`aura`, SpriteKind.Visuals)
    aura_weapon.setPosition(hero.x, hero.y)
    aura_weapon.z = hero.z - 2
}
function setup_enemy (enemy: Sprite, name: string, health: number, damage: number, speed: number) {
    sprites.setDataString(enemy, "name", name)
    sprites.setDataNumber(enemy, "health", health)
    sprites.setDataNumber(enemy, "damage", damage)
    enemy.follow(hero, speed)
}
sprites.onDestroyed(SpriteKind.Explosion, function (sprite) {
    flame_weapon = sprites.createProjectileFromSprite(assets.image`explosion`, sprite, 0, 0)
    flame_weapon.lifespan = 500
})
function create_upgrade_menu () {
    custom.add_upgrade_to_list("Daggers", "throw 3 daggers")
    spray_spawn_count = 0
    spray_speed = 100
    spray_firing_rate = 500
    custom.add_upgrade_to_list("Spark", "auto aim missile")
    tracer_spawn_count = 0
    tracer_speed = 100
    tracer_firing_rate = 500
    custom.add_upgrade_to_list("Fireball", "explode on impact")
    exploder_spawn_count = 1
    exploder_speed = 100
    exploder_firing_rate = 1000
    custom.add_upgrade_to_list("Bible", "circles the player")
    orbit_spawn_count = 0
    orbit_angular_speed = 5
    orbit_distance = 30
    orbit_duration = 2000
    orbit_refresh_rate = 5000
    custom.add_upgrade_to_list("Garlic", "damage aura")
    aura_spawn_count = 0
    aura_tick_rate = 500
    custom.add_upgrade_to_list("Holy Water", "toss and burn")
    molotov_spawn_count = 0
    molotov_speed = 200
    molotov_duration_min = 150
    molotov_duration_max = 350
    molotov_flame_duration = 1000
    molotov_firing_rate = 1000
}
function create_enemy_waves () {
    custom.reset_wave_data()
    custom.add_wave_data(0, 1, "zombie")
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
let spawn_angle_spacing = 0
let new_weapon: Sprite = null
let game_is_ready = 0
let hero_xp: StatusBarSprite = null
let hero_health: StatusBarSprite = null
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
let spray_firing_rate = 0
let spray_speed = 0
let spray_spawn_count = 0
let hero: Sprite = null
let aura_weapon: Sprite = null
let molotov_flame_duration = 0
let flame_weapon: Sprite = null
let new_enemy: Sprite = null
let list: string[] = []
setup_game()
game.onUpdate(function () {
    if (aura_spawn_count > 0) {
        aura_weapon.setPosition(hero.x, hero.y)
    }
})
game.onUpdateInterval(exploder_firing_rate, function () {
    if (game_is_ready == 1 && exploder_spawn_count > 0) {
        new_weapon = sprites.create(assets.image`fireball`, SpriteKind.Explosion)
    }
    custom.aim_projectile_at_angle(
    new_weapon,
    randint(0, 360),
    AimType.velocity,
    exploder_speed,
    hero
    )
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
        new_weapon = sprites.create(assets.image`aura-pause`, SpriteKind.Projectile)
        new_weapon.setPosition(hero.x, hero.y)
        new_weapon.lifespan = 100
        new_weapon.z = hero.z - 1
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
            new_weapon.lifespan = 1000
        }
    }
})
game.onUpdateInterval(500, function () {
    if (false) {
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
    }
})
