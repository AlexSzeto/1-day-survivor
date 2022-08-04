
/**
* Use this file to define custom functions and blocks.
* Read more at https://arcade.makecode.com/blocks/custom
*/

enum AimType {
    position,
    velocity,
    acceleration,
    friction
}

enum GameState {
    setup,
    normal,
    menu
}

/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon=""
namespace custom {
    type UpgradeData = {
        name: string;
        icon: Image;
        description: string;
        prerequisite: string;
    }

    type CollisionBox = {
        l: number;
        r: number;
        t: number;
        b: number;
    }

    const upgrades_master_list: UpgradeData[] = []
    const upgrades_available_list: UpgradeData[] = []
    const upgrades_obtained: UpgradeData[] = []

    let max_basic_weapons: number = 3
    let max_basic_accessories: number = 3
    let current_game_state: GameState = GameState.setup

    let spawn_wave: string[] = []
    let current_wave_position: number = 0
    let max_wave_length: number = 6

    /**
     * add upgrade to the master list
     */
    //% group="Upgrades"
    //% block="add upgrade to master list with name $name $icon description $description || which requires $prerequisite with weight $weight"
    export function add_upgrade_to_list(name: string, icon: Image, description: string, prerequisite?: string, weight: number = 1): void {
        for(let i=0; i<weight; i++) {
            upgrades_available_list.push({
                name,
                icon,
                description,
                prerequisite
            })
            upgrades_master_list.push({
                name,
                icon,
                description,
                prerequisite
            })
        }
    }

    /**
     * pick a set of eligible upgrades from the master list
     */
    //% group="Upgrades"
    //% blockId="get_upgrade_choices"
    //% block="list of eligible upgrades up to $max" and include basic items $include_basic_items
    export function get_upgrade_choices(max: number, include_basic_items: boolean): string[] {
        const basic_weapons_count = upgrades_obtained.reduce((count, upgrade) => (upgrade.prerequisite == "WEAPON") ? count + 1 : count, 0)
        const basic_armors_count = upgrades_obtained.reduce((count, upgrade) => (upgrade.prerequisite == "ACCESSORY") ? count + 1 : count, 0)
        const eligible_list = upgrades_available_list
           .filter(upgrade => 
                (
                    (
                        include_basic_items && (
                            ((upgrade.prerequisite == "WEAPON") && basic_weapons_count < max_basic_weapons)
                            || ((upgrade.prerequisite == "ACCESSORY") && basic_armors_count < max_basic_accessories && upgrades_obtained.length > 0)
                        )
                    )
                    || upgrades_obtained.some(existing_upgrade => existing_upgrade.name == upgrade.prerequisite)
               ) && !upgrades_obtained.some(existing_upgrade => existing_upgrade.name == upgrade.name)
            )
        
        let choices: UpgradeData[] = []

        if (eligible_list.length <= max) {
            choices = eligible_list
        } else {
            for (let count = 0; count < max; count++) {
                let choice = Math.pickRandom(eligible_list)
                while (choices.some(existing_choice => existing_choice.name == choice.name)) {
                    choice = Math.pickRandom(eligible_list)
                }
                choices.push(choice)
            }
        }

        return choices.map(upgrade => `${upgrade.name}: (${upgrade.description})`)
    }


    /**
     * get obtained upgrade name list
     */
    //% group="Upgrades"
    //% block="name list for obtained upgrades"
    export function get_obtained_highest_upgrade_names(): string[] {
        return upgrades_obtained
            .filter(past_upgrade => !upgrades_obtained.some(newer_upgrade => newer_upgrade.prerequisite == past_upgrade.name))
            .map(upgrade => upgrade.name)
            .sort()
    }

    //% group="Upgrades"
    //% block="upgrade level of $name"
    export function get_upgrade_level_of(name: string): number {
        let level = 1
        let prereq = null
        do {
            prereq = upgrades_obtained.find(upgrade => upgrade.prerequisite == name)
            if(prereq != null) {
                level++
                name = prereq.name
            }
        } while(prereq != null)
        return level
    }

    //% group="Upgrades"
    //% block="name of strongest upgrade"
    export function get_strongest_upgrade(): string {
        return upgrades_obtained.length == 0 ? "" :
        upgrades_obtained
            .reduce((strongest, upgrade) => get_upgrade_level_of(upgrade.name) > get_upgrade_level_of(strongest.name) ? upgrade : strongest, upgrades_obtained[0]).name
    }

    /**
     * get obtained upgrade icon list
     */
    //% group="Upgrades"
    //% block="icon list for obtained upgrades"
    export function get_obtained_upgrade_icons(): Image[] {
        return upgrades_obtained
            .filter(upgrade => upgrade.prerequisite == "WEAPON" || upgrade.prerequisite == "ACCESSORY")
            .map(upgrade => get_upgrade_icon(upgrade.name))
    }

    /**
     * get obtained upgrade name list
     */
    //% group="Upgrades"
    //% block="name list for obtained upgrades"
    export function get_obtained_upgrade_names(): string[] {
        return upgrades_obtained
            .filter(upgrade => upgrade.prerequisite == "WEAPON" || upgrade.prerequisite == "ACCESSORY")
            .map(upgrade => upgrade.name)
    }

    /**
     * get icon of an upgrade
     */
    //% group="Upgrades"
    //% block=" upgrade icon of $menu_description"
    export function get_upgrade_icon(menu_description: string): Image {
        const upgrade_name = menu_description.indexOf(':') >= 0 ? menu_description.split(':')[0] : menu_description
        return upgrades_master_list.find(upgrade => upgrade.name == upgrade_name).icon
    }

    /**
     * add upgrade to the obtained list
     */
    //% group="Upgrades"
    //% block="obtain upgrade $menu_description"
    export function get_upgrade(menu_description: string): string {
        const next_upgrade_name = menu_description.indexOf(':') >= 0 ? menu_description.split(':')[0] : menu_description
        const upgrade_item = upgrades_available_list.find(upgrade => upgrade.name == next_upgrade_name)
        if(upgrade_item.prerequisite != "CONSUMABLE") {
            upgrades_obtained.push(upgrade_item)
            upgrades_available_list.removeElement(upgrade_item)
        }
        return next_upgrade_name
    }

    /**
     * check if upgrade is in the obtained list
     */
    //% group="Upgrades"
    //% block="has upgrade $name"
    export function has_upgrade(name: string): boolean {
        return upgrades_obtained.some(upgrade => upgrade.name == name)
    }

    /**
     * convert upgrade list to mini menu items
     */
    //% group="Utility"
    //% block="convert text array $list into mini menu items"
    export function convert_string_array_to_mini_menu_items(list: string[]): miniMenu.MenuItem[] {
        return list.map(text => miniMenu.createMenuItem(text, get_upgrade_icon(text)))
    }

    /**
     * get distance between two sprites
     */
    //% group="Utility"
    //% block="get distance between $a and $b"
    //% a.shadow=variables_get
    //% b.shadow=variables_get
    export function get_distance_between(a: Sprite, b: Sprite): number {
        return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y))
    }


    /**
     * shift an image in the default palette one grade toward white
     */
    //% group="Utility"
    //% block="color shift $image toward white"
    //% image.shadow=variables_get
    export function color_shift_white(image: Image): void {
        image.replace(9, 1)
        image.replace(13, 1)
        image.replace(5, 1)
        image.replace(3, 1)
        image.replace(4, 5)
        image.replace(7, 9)
        image.replace(11, 13)
        image.replace(2, 4)
        image.replace(6, 9)
        image.replace(12, 11)
        image.replace(10, 3)
        image.replace(14, 4)
        image.replace(8, 6)
        image.replace(15, 12)
    }

    /**
     * check if the box containing the two sprites collide
     */
    //% group="Sprite"
    //% block="$source and $target has colliding sprite boxes || multiply box scale by $box_scale"
    //% source.shadow=variables_get
    //% target.shadow=variables_get
    export function box_collision(source: Sprite, target: Sprite, box_scale: number = 1.0): boolean {

        const pl = source.x - source.width / 2 * box_scale
        const pr = source.x + source.width / 2 * box_scale
        const pt = source.y - source.height / 2 * box_scale
        const pb = source.y + source.height / 2 * box_scale
        
        const el = target.x - target.width / 2 * box_scale
        const er = target.x + target.width / 2 * box_scale
        const et = target.y - target.height / 2 * box_scale
        const eb = target.y + target.height / 2 * box_scale

        return (source.flags & sprites.Flag.Destroyed) == 0 &&
        (target.flags & sprites.Flag.Destroyed) == 0 &&
        (pr >= el && pl <= er) && (pb >= et && pt <= eb)
    }

    /**
     * place one sprite on top of another
     */
    //% group="Sprite"
    //% block="place $source on top of $target"
    //% source.shadow=variables_get
    //% target.shadow=variables_get
    export function move_sprite_on_top_of_another(source: Sprite, target: Sprite): void {
        source.x = target.x
        source.y = target.y
    }

    /**
     * place a sprite using camera coordinates
     */
    //% group="Sprite"
    //% block="place $source on camera coordinates $x $y || with camera following $target"
    //% source.shadow=variables_get
    export function move_sprite_relative_to_camera(source: Sprite, x: number, y: number, target?: Sprite): void {
        if(target) {
            source.x = target.x - scene.screenWidth() / 2 + x
            source.y = target.y - scene.screenHeight() / 2 + y
        } else {
            source.x = scene.cameraLeft() + x
            source.y = scene.cameraTop() + y
        }
    }

    /**
     * move sprite just outside camera
     */
    //% group="Sprite"
    //% block="move $target out of camera"
    //% target.shadow=variables_get
    export function move_sprite_off_camera(target: Sprite): void {
        let spawn_pixel: number = Math.randomRange(0, scene.screenWidth() * 2 + scene.screenHeight() * 2)
        if(spawn_pixel < scene.screenWidth()) {
            target.y = scene.cameraTop() - target.height / 2
            target.x = scene.cameraLeft() + spawn_pixel
            return
        }
        spawn_pixel -= scene.screenWidth()
        if (spawn_pixel < scene.screenHeight()) {
            target.x = scene.cameraLeft() + scene.screenWidth() + target.width / 2
            target.y = scene.cameraTop() + spawn_pixel
            return
        }
        spawn_pixel -= scene.screenHeight()
        if (spawn_pixel < scene.screenWidth()) {
            target.y = scene.cameraTop() + scene.screenHeight() + target.height / 2
            target.x = scene.cameraLeft() + spawn_pixel
            return
        }
        spawn_pixel -= scene.screenWidth()
        {
            target.x = scene.cameraLeft() - target.width / 2
            target.y = scene.cameraTop() + spawn_pixel
        }
    }

    /**
     * aim projectile at another sprite with a set velocity
     */
    //% group="Sprite"
    //% block="aim $projectile at $target with $aim_type $value"
    //% projectile.shadow=variables_get
    //% target.shadow=variables_get
    export function aim_projectile_at_sprite(projectile: Sprite, target: Sprite, aim_type: AimType = AimType.velocity, value: number = 100): void {
        if(!projectile || !target) {
            return
        }
        const scaling_factor = value / get_distance_between(projectile, target)
        const scaled_x = (target.x - projectile.x) * scaling_factor
        const scaled_y = (target.y - projectile.y) * scaling_factor
        switch(aim_type) {
            case AimType.position:
                projectile.x = target.x + scaled_x
                projectile.y = target.y + scaled_y
                break;
            case AimType.velocity:
                projectile.vx = scaled_x
                projectile.vy = scaled_y
                break;
            case AimType.acceleration:
                projectile.ax = scaled_x
                projectile.ay = scaled_y
                break;
            case AimType.friction:
                projectile.fx = scaled_x
                projectile.fy = scaled_y
                break;
        }
    }

    /**
     * aim projectile at a specific angle
     */
    //% group="Sprite"
    //% block="aim $projectile at angle $angle and set $aim_type $value || away from $target"
    //% projectile.shadow=variables_get
    export function aim_projectile_at_angle(projectile: Sprite, angle: number = 0, aim_type: AimType = AimType.velocity, value: number = 100, target?: Sprite): void {
        if(!projectile) {
            return
        }
        if(target) {
            projectile.x = target.x
            projectile.y = target.y
        }
        const aim_x = value * Math.cos(angle/180 * Math.PI)
        const aim_y = value * Math.sin(angle/180 * Math.PI)
        switch (aim_type) {
            case AimType.position:
                projectile.x += aim_x
                projectile.y += aim_y
                break;
            case AimType.velocity:
                projectile.vx = aim_x
                projectile.vy = aim_y
                break;
            case AimType.acceleration:
                projectile.ax = aim_x
                projectile.ay = aim_y
                break;
            case AimType.friction:
                projectile.fx = aim_x
                projectile.fy = aim_y
                break;
        }
    }

    /**
     * change game state
     */
    //% group="Game"
    //% block="set game state to $state"
    export function set_game_state(state: GameState): void {
        // no need to pause since we're eliminating all interactive sprites
        /*
        if(current_game_state == GameState.normal && state == GameState.menu) {
            game.pushScene()
        } else if (current_game_state == GameState.menu && state == GameState.normal) {
            game.popScene()
        }
        */
        current_game_state = state
    }

    /**
     * check current game state
     */
    //% group="Game"
    //% block="current game state is $state"
    export function game_state_is(state: GameState = GameState.normal): boolean {
        return current_game_state == state
    }

    /**
     * reset wave data
     */
    //% group="Spawn Waves"
    //% block="reset spawn wave data"
    export function reset_wave_data(): void {
        spawn_wave = []
        current_wave_position = 0
    }

    /**
     * add wave data
     */
    //% group="Spawn Waves"
    //% block="insert $count of $name into back of spawn wave"
    export function add_wave_data(name: string, count: number = 1): void {
        for(let i=0; i<count; i++) {
            spawn_wave.push(name)
        }
    }

    /**
     * add priority wave data
     */
    //% group="Spawn Waves"
    //% block="insert $count of $name into front of spawn wave"
    export function add_priority_wave_data(name: string, count: number = 1): void {
        for (let i = 0; i < count; i++) {
            spawn_wave.unshift(name)
        }
    }

    /**
     * add a random enemy out of a list to the front of the wave data
     */
    //% group="Spawn Waves"
    //% block="insert a random pick from $names into top of spawn wave"
    export function add_priority_random_enemy_to_wave(names: string[]): void {
        spawn_wave.unshift(Math.pickRandom(names))
    }

    /**
     * get a linear list of enemy names to spawn from the next spawn wave
     */
    //% group="Spawn Waves"
    //% block="list of current spawn wave enemies"
    export function get_next_wave_enemy_names(length: number): string[]
    {
        const wave = []
        const enemies = sprites.allOfKind(SpriteKind.Enemy)
        for (let j=0; j<max_wave_length; j++) {                
            const name = spawn_wave[current_wave_position]
            current_wave_position = (current_wave_position + 1) % max_wave_length
            let enemy_exists = false
            for (let enemy of enemies) {
                if (!enemy_exists && sprites.readDataString(enemy, "name") == name) {
                    enemies.removeElement(enemy)
                    enemy_exists = true
                }
            }
            if (!enemy_exists) {
                wave.push(name)
                if(wave.length >= length) {
                    return wave
                }
            }
        }
        return wave
    }


    /**
     * get a count of spawns from a spawn wave
     */
    //% group="Spawn Waves"
    //% block="count of current enemy wave list"
    export function get_wave_enemy_count(): number {
        return spawn_wave.length
    }

}
