
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
        description: string;
        prerequisite: string;
    }

    const upgrade_master_list: UpgradeData[] = []
    const upgrades_obtained: UpgradeData[] = []

    let current_game_state: GameState = GameState.normal

    /**
     * add upgrade to the master list
     * @param name unique name for the upgrade
     * @param description description for the upgrade, to be shown in the menu
     * @param prerequisite name of the previous upgrade required
     */
    //% group="Upgrades"
    //% block="add upgrade to master list with name $name description $description || which requires $prerequisite"
    export function add_upgrade_to_list(name: string, description: string, prerequisite?: string): void {
        upgrade_master_list.push({
            name,
            description,
            prerequisite
        })
    }

    /**
     * pick a set of eligible upgrades from the master list
     * @param max maximum number of items to pick
     */
    //% group="Upgrades"
    //% blockId="get_upgrade_choices"
    //% block="list of eligible upgrades up to $max"
    export function get_upgrade_choices(max: number): miniMenu.MenuItem[] {
        const eligible_list = upgrade_master_list
           .filter(upgrade => !(upgrade.prerequisite) || upgrades_obtained.some(existing_upgrade => existing_upgrade.name == upgrade.prerequisite))
        let choices: UpgradeData[] = []

        if (eligible_list.length <= max) {
            choices = eligible_list
        } else {
            for (let count = 0; count < max; count++) {
                let choice = Math.pickRandom(eligible_list)
                while (choices.indexOf(choice) >= 0) {
                    choice = Math.pickRandom(eligible_list)
                }
                choices.push(choice)
            }
        }

        return choices.map(upgrade => miniMenu.createMenuItem(`${upgrade.name}: (${upgrade.description})`))
    }

    /**
     * add upgrade to the obtained list
     * @param menu_description menu description generated by get_upgrade_choices
     */
    //% group="Upgrades"
    //% block="obtain upgrade $menu_description"
    export function get_upgrade(menu_description: string): void {
        const next_upgrade_name = menu_description.split(':')[0]
        const upgrade_item = upgrade_master_list.find(upgrade => upgrade.name == next_upgrade_name)
        upgrades_obtained.push(upgrade_item)
        upgrade_master_list.removeElement(upgrade_item)
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
     * move sprite just outside camera
     */
    //% group="Sprite"
    //% block="move $target out of camera"
    //% target.shadow=variables_get
    export function move_sprite_off_camera(target: Sprite): void {
        const spawn_pixel: number = Math.randomRange(0, scene.screenWidth() * 2 + scene.screenHeight() * 2)
        if(spawn_pixel < scene.screenWidth()) {
            target.y = scene.cameraTop() - target.height / 2
            target.x = scene.cameraLeft() + spawn_pixel
        } else if (spawn_pixel < scene.screenWidth() + scene.screenHeight()) {
            target.x = scene.cameraLeft() + scene.screenWidth() + target.width / 2
            target.y = scene.cameraTop() + spawn_pixel - scene.screenWidth()
        } else if (spawn_pixel < scene.screenWidth() * 2 + scene.screenHeight()) {
            target.y = scene.cameraTop() + scene.screenHeight() + target.height / 2
            target.x = scene.cameraLeft() + spawn_pixel - scene.screenWidth() - scene.screenHeight()
        } else {
            target.x = scene.cameraLeft() - target.width / 2
            target.y = scene.cameraTop() + spawn_pixel - scene.screenWidth() * 2 - scene.screenHeight()
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
    export function aim_projectile_at_angle(projectile: Sprite, angle: number = 0, aim_type: AimType = AimType.velocity, value: number = 100, target: Sprite = null): void {
        if(target) {
            projectile.x = target.x
            projectile.y = target.y
        }
        const aim_x = value * Math.cos(angle)
        const aim_y = value * Math.sin(angle)
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
     * pause game for menus
     */
    //% group="Game"
    //% block="pause game for menus"
    export function pause_game_for_menus(): void {
        current_game_state = GameState.menu
        game.pushScene()
    }


    /**
     * unpause game from menus
     */
    //% group="Game"
    //% block="unpause game from menus"
    export function pause_game_from_menus(): void {
        current_game_state = GameState.normal
        game.popScene()
    }

    /**
     * check current game state
     */
    //% group="Game"
    //% block="current game state is $state"
    export function game_state_is(state: GameState): boolean {
        return current_game_state == state
    }


    type SpawnData = {
        name: string
        count: number
    }
    type WaveData = SpawnData[]

    let spawn_waves: WaveData[] = []
    let current_wave: number = 0

    /**
     * reset wave data
     */
    //% group="Spawn Waves"
    //% block="reset spawn wave data"
    export function reset_wave_data(): void {
        spawn_waves = []
        current_wave = 0
    }

    /**
     * add wave data
     */
    //% group="Spawn Waves"
    //% block="insert $count of $name into wave $wave"
    export function add_wave_data(wave: number = 0, count: number = 1, name:string, ): void {
        while(spawn_waves.length <= wave) {
            spawn_waves.push([])
        }
        spawn_waves[wave].push({
            name,
            count
        })
    }

    /**
     * advance to the next wave
     */
    //% group="Spawn Waves"
    //% block="advance to the next wave"
    export function advance_wave(): void {
        current_wave = (current_wave + 1) % spawn_waves.length
    }


    /**
     * get a linear list of enemy names to spawn from the next spawn wave
     */
    //% group="Spawn Waves"
    //% block="list of current spawn wave enemies"
    export function get_wave_enemy_list(): string[]
    {
        const list: string[] = []        
        spawn_waves[current_wave].forEach(spawn => {
            for(let i=0; i<spawn.count; i++) {
                list.push(spawn.name)
            }
        })
        return list
    }
}
