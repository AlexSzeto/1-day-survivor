namespace StatusBarKind {
    export const Experience = StatusBarKind.create()
}
function spawn_enemy_wave () {
    list = custom.get_wave_enemy_list()
    for (let value of list) {
        if (value == "zombie") {
            new_enemy = sprites.create(assets.image`ghost`, SpriteKind.Enemy)
            setup_enemy(new_enemy, value, 10, 1, 20)
            custom.move_sprite_off_camera(new_enemy)
        }
    }
}
function setup_enemy (enemy: Sprite, name: string, health: number, damage: number, speed: number) {
    sprites.setDataString(enemy, "name", name)
    sprites.setDataNumber(enemy, "health", health)
    sprites.setDataNumber(enemy, "damage", damage)
    enemy.follow(hero, speed)
}
function create_upgrade_menu () {
    custom.add_upgrade_to_list("Daggers", "throw 3 daggers")
    spray_throw_count = 3
    spray_speed = 100
    spray_firing_rate = 500
    custom.add_upgrade_to_list("Spark", "auto aim missile")
    tracer_speed = 100
    tracer_firing_rate = 500
    custom.add_upgrade_to_list("Fireball", "explode on impact")
    exploder_speed = 100
    exploder_firing_rate = 100
    custom.add_upgrade_to_list("Bible", "circles the player")
    orbit_count = 1
    orbit_speed = 100
    custom.add_upgrade_to_list("Garlic", "damage aura")
    aura_tick_rate = 100
    custom.add_upgrade_to_list("Holy Water", "toss and burn")
    molotov_throw_count = 1
    molotov_speed = 100
    molotov_duration = 1000
}
function create_enemy_waves () {
    custom.reset_wave_data()
    custom.add_wave_data(0, 1, "zombie")
}
function setup_game () {
    tiles.setCurrentTilemap(tilemap`dungeon`)
    hero = sprites.create(assets.image`survivor`, SpriteKind.Player)
    tiles.placeOnRandomTile(hero, sprites.dungeon.floorLightMoss)
    scene.cameraFollowSprite(hero)
    hero_health = statusbars.create(20, 4, StatusBarKind.Health)
    hero_health.attachToSprite(hero, 4, 0)
    hero_health.max = 10
    hero_health.value = 10
    hero_health.setColor(7, 2)
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
}
let new_weapon: Sprite = null
let hero_xp: StatusBarSprite = null
let hero_health: StatusBarSprite = null
let molotov_duration = 0
let molotov_speed = 0
let molotov_throw_count = 0
let aura_tick_rate = 0
let orbit_speed = 0
let orbit_count = 0
let exploder_firing_rate = 0
let exploder_speed = 0
let tracer_firing_rate = 0
let tracer_speed = 0
let spray_firing_rate = 0
let spray_speed = 0
let spray_throw_count = 0
let hero: Sprite = null
let new_enemy: Sprite = null
let list: string[] = []
setup_game()
game.onUpdateInterval(spray_firing_rate, function () {
    for (let index = 0; index < spray_throw_count; index++) {
        new_weapon = sprites.create(assets.image`dagger`, SpriteKind.Projectile)
        custom.aim_projectile_at_angle(
        new_weapon,
        hero,
        randint(0, 360),
        AimType.velocity,
        spray_speed
        )
    }
})
game.onUpdateInterval(500, function () {
    spawn_enemy_wave()
})
