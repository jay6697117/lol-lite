(() => {
  'use strict';

  const WIDTH = 1280;
  const HEIGHT = 720;
  const HUD_Y = 590;
  const BLUE = 'blue';
  const RED = 'red';
  const LANE_PATH = [
    { x: 128, y: 622 },
    { x: 320, y: 520 },
    { x: 640, y: 360 },
    { x: 960, y: 192 },
    { x: 1150, y: 88 },
  ];
  const TEAM_STYLE = {
    blue: {
      main: '#36d7e8',
      dim: '#166d82',
      dark: '#082c39',
      bar: '#29e0aa',
      mana: '#2788ff',
      text: '#c8fff4',
    },
    red: {
      main: '#ff385f',
      dim: '#9a203c',
      dark: '#3d0f23',
      bar: '#ff4857',
      mana: '#b64dff',
      text: '#ffd4de',
    },
  };
  const BACKGROUND_PATH = 'assets/backgrounds/moba-lane-bg-v2-dark.png';
  const OBJECT_SHEET_PATH = 'assets/sprites/moba-object-sheet.png';
  const BUILDING_SHEET_PATH = 'assets/sprites/moba-building-sheet-v2.png';
  const ICON_SHEET_PATH = 'assets/ui/moba-icon-sheet-v2.png';
  const MINION_SHEET_PATH = 'assets/sprites/minion-animation-sheet.png';
  const MINION_DIRECTION_SHEET_PATH = 'assets/sprites/minion-animation-sheet-v2.png';
  const EFFECT_SHEET_PATH = 'assets/effects/moba-effect-sheet.png';
  const ART_CELL = 256;
  const ART_COLUMNS = 4;
  const BUILDING_CELL = 256;
  const BUILDING_COLUMNS = 4;
  const ANIM_CELL = 64;
  const ANIM_COLUMNS = 6;
  const SPRITE_PATHS = {
    idle: 'run/64/final/idle-sheet-clean.png',
    move: 'run/64/final/move-sheet-clean.png',
    attack: 'run/64/final/attack-sheet-clean.png',
    hit: 'run/64/final/hit-sheet-clean.png',
    death: 'run/64/final/death-sheet-clean.png',
  };
  const ENEMY_SPRITE_PATHS = {
    idle: 'run/rift-fighter/64/final/idle-sheet-clean.png',
    move: 'run/rift-fighter/64/final/move-sheet-clean.png',
    attack: 'run/rift-fighter/64/final/attack-sheet-clean.png',
    hit: 'run/rift-fighter/64/final/hit-sheet-clean.png',
    death: 'run/rift-fighter/64/final/death-sheet-clean.png',
  };
  const OBJECT_CELLS = {
    minion: {
      blue: { melee: 0, ranged: 1, siege: 2 },
      red: { melee: 4, ranged: 5, siege: 6 },
    },
    decor: {
      tree: 10,
      brush: 11,
      rock: 12,
      ruin: 13,
      wall: 13,
      torchBlue: 14,
      torchRed: 15,
    },
  };
  const ICON_CELLS = {
    skills: { q: 0, w: 1, e: 2, r: 3 },
    items: [4, 5, 6, 7],
    summoners: [8, 9],
  };
  const BUILDING_CELLS = {
    blue: { tower: 0, core: 2 },
    red: { tower: 1, core: 3 },
  };
  const MINION_ROWS = {
    blue: {
      melee: { move: 0, attack: 1 },
      ranged: { move: 2, attack: 3 },
      siege: { move: 4, attack: 5 },
    },
    red: {
      melee: { move: 6, attack: 7 },
      ranged: { move: 8, attack: 9 },
      siege: { move: 10, attack: 11 },
    },
  };
  const MINION_DIRECTION_ROWS = {
    'south-east': {
      blue: {
        melee: { move: 0, attack: 1 },
        ranged: { move: 2, attack: 3 },
        siege: { move: 16, attack: 17 },
      },
      red: {
        melee: { move: 4, attack: 5 },
        ranged: { move: 6, attack: 7 },
        siege: { move: 18, attack: 19 },
      },
    },
    'north-west': {
      blue: {
        melee: { move: 8, attack: 9 },
        ranged: { move: 10, attack: 11 },
        siege: { move: 20, attack: 21 },
      },
      red: {
        melee: { move: 12, attack: 13 },
        ranged: { move: 14, attack: 15 },
        siege: { move: 22, attack: 23 },
      },
    },
  };
  const EFFECT_ROWS = {
    slash: 0,
    ring: 1,
    dash: 2,
    blast: 3,
    projectile: 4,
    spark: 5,
  };
  const ITEMS = [
    { key: '1', name: '裂纹长刃', cost: 300, stat: '+14 攻击', apply: hero => { hero.attackDamage += 14; } },
    { key: '2', name: '辉石护符', cost: 280, stat: '+160 生命', apply: hero => { hero.maxHp += 160; hero.hp += 160; } },
    { key: '3', name: '巡林者靴', cost: 260, stat: '+24 移速', apply: hero => { hero.speed += 24; } },
    { key: '4', name: '星火法杖', cost: 360, stat: '+技能伤害', apply: hero => { hero.spellPower += 24; hero.maxMp += 80; hero.mp += 80; } },
  ];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const hpRatio = entity => clamp(entity.hp / entity.maxHp, 0, 1);
  const manaRatio = entity => clamp(entity.mp / entity.maxMp, 0, 1);
  const otherTeam = team => (team === BLUE ? RED : BLUE);

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawText(ctx, text, x, y, size = 14, color = '#eafff8', align = 'left', weight = '700') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px Georgia, Songti SC, serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.75)';
    ctx.shadowBlur = 6;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawBar(ctx, x, y, w, h, ratio, fill, back = 'rgba(0,0,0,.58)', stroke = 'rgba(255,255,255,.22)') {
    ctx.save();
    roundedRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = back;
    ctx.fill();
    roundedRect(ctx, x, y, w * clamp(ratio, 0, 1), h, h / 2);
    ctx.fillStyle = fill;
    ctx.fill();
    roundedRect(ctx, x, y, w, h, h / 2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function directionRow(dx, dy) {
    if (Math.abs(dx) + Math.abs(dy) < 0.01) return 0;
    const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    if (deg >= 337.5 || deg < 22.5) return 2;
    if (deg < 67.5) return 1;
    if (deg < 112.5) return 0;
    if (deg < 157.5) return 7;
    if (deg < 202.5) return 6;
    if (deg < 247.5) return 5;
    if (deg < 292.5) return 4;
    return 3;
  }

  function rowVector(row) {
    const vectors = [
      { x: 0, y: 1 },
      { x: 0.7, y: 0.7 },
      { x: 1, y: 0 },
      { x: 0.7, y: -0.7 },
      { x: 0, y: -1 },
      { x: -0.7, y: -0.7 },
      { x: -1, y: 0 },
      { x: -0.7, y: 0.7 },
    ];
    return vectors[row] || vectors[0];
  }

  function minionDirectionKey(row) {
    const v = rowVector(row);
    if (v.x > 0.15) return 'south-east';
    if (v.x < -0.15) return 'north-west';
    return null;
  }

  function pointOnPath(t, path = LANE_PATH) {
    const lengths = [];
    let total = 0;
    for (let i = 0; i < path.length - 1; i += 1) {
      const len = distance(path[i], path[i + 1]);
      lengths.push(len);
      total += len;
    }
    let left = clamp(t, 0, 1) * total;
    for (let i = 0; i < lengths.length; i += 1) {
      if (left <= lengths[i] || i === lengths.length - 1) {
        const p0 = path[i];
        const p1 = path[i + 1];
        const local = lengths[i] === 0 ? 0 : left / lengths[i];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const len = Math.hypot(dx, dy) || 1;
        return {
          x: lerp(p0.x, p1.x, local),
          y: lerp(p0.y, p1.y, local),
          angle: Math.atan2(dy, dx),
          nx: -dy / len,
          ny: dx / len,
        };
      }
      left -= lengths[i];
    }
    return { ...path[path.length - 1], angle: 0, nx: 0, ny: 1 };
  }

  function traceLanePath(ctx, path = LANE_PATH) {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length - 1; i += 1) {
      const current = path[i];
      const next = path[i + 1];
      ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
    }
    const last = path[path.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  function seeded(seed) {
    return Math.sin(seed * 91.345) * 0.5 + 0.5;
  }

  class CombatText {
    constructor(text, x, y, color) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.life = 1.05;
      this.maxLife = 1.05;
    }

    update(dt) {
      this.life -= dt;
      this.y -= dt * 22;
    }

    draw(ctx) {
      const alpha = clamp(this.life / this.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawText(ctx, this.text, this.x, this.y, 14, this.color, 'center', '900');
      ctx.restore();
    }
  }

  class Effect {
    constructor(options) {
      Object.assign(this, options);
      this.life = options.life ?? 0.55;
      this.maxLife = this.life;
    }

    update(dt) {
      this.life -= dt;
    }

    draw(ctx, image = null) {
      const p = 1 - clamp(this.life / this.maxLife, 0, 1);
      const alpha = clamp(this.life / this.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      const effectRow = EFFECT_ROWS[this.type];
      if (image && effectRow !== undefined) {
        const frame = Math.min(ANIM_COLUMNS - 1, Math.floor(p * ANIM_COLUMNS));
        const size = this.radius * (this.type === 'blast' ? 2.6 : this.type === 'ring' ? 2.2 : 2);
        ctx.translate(this.x, this.y);
        if (this.angle !== undefined) ctx.rotate(this.angle);
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(image, frame * ANIM_CELL, effectRow * ANIM_CELL, ANIM_CELL, ANIM_CELL, -size / 2, -size / 2, size, size);
        ctx.restore();
        return;
      }
      ctx.strokeStyle = this.color;
      ctx.fillStyle = this.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 18;
      if (this.type === 'ring') {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * (0.45 + p), this.radius * 0.46 * (0.45 + p), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.type === 'slash') {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, -0.65, 0.65);
        ctx.stroke();
      } else if (this.type === 'blast') {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * p, this.radius * 0.58 * p, 0, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}${Math.floor(alpha * 80).toString(16).padStart(2, '0')}`;
        ctx.fill();
        ctx.stroke();
      } else if (this.type === 'spark') {
        for (let i = 0; i < 7; i += 1) {
          const a = i * 0.9 + p * 2;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x + Math.cos(a) * this.radius * p, this.y + Math.sin(a) * this.radius * 0.55 * p);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  class Projectile {
    constructor(game, options) {
      this.game = game;
      Object.assign(this, options);
      this.dead = false;
      this.radius = options.radius ?? 6;
      this.speed = options.speed ?? 440;
      this.color = options.color ?? '#ffffff';
      this.life = 3;
      this.age = 0;
    }

    update(dt) {
      if (this.dead) return;
      this.age += dt;
      this.life -= dt;
      if (this.life <= 0 || !this.game.isAlive(this.target)) {
        this.dead = true;
        return;
      }
      const aim = { x: this.target.x, y: this.target.y - (this.target.kind === 'building' ? 28 : 20) };
      const dx = aim.x - this.x;
      const dy = aim.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = this.speed * dt;
      if (dist <= step + this.radius) {
        this.dead = true;
        this.game.applyDamage(this.target, this.damage, this.source, this.flags || {});
        this.game.effects.push(new Effect({ type: 'spark', x: aim.x, y: aim.y, color: this.color, radius: 34, life: 0.35 }));
        return;
      }
      this.x += dx / dist * step;
      this.y += dy / dist * step;
    }

    draw(ctx, image = null) {
      if (this.dead) return;
      ctx.save();
      if (image && EFFECT_ROWS.projectile !== undefined) {
        const frame = Math.floor(this.age * 14) % ANIM_COLUMNS;
        const size = this.radius * 8;
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(image, frame * ANIM_CELL, EFFECT_ROWS.projectile * ANIM_CELL, ANIM_CELL, ANIM_CELL, this.x - size / 2, this.y - size / 2, size, size);
        ctx.restore();
        return;
      }
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class Unit {
    constructor(game, options) {
      this.game = game;
      this.id = game.nextId += 1;
      Object.assign(this, options);
      this.hp = this.maxHp;
      this.dead = false;
      this.deathTimer = 0;
      this.attackCooldown = 0;
      this.hitTimer = 0;
      this.direction = this.team === BLUE ? 3 : 7;
      this.moving = false;
      this.target = null;
    }

    takeDamage(amount, source) {
      if (this.dead) return;
      let finalAmount = amount;
      if (this.kind === 'hero' && this.shield > 0) {
        const blocked = Math.min(this.shield, finalAmount);
        this.shield -= blocked;
        finalAmount -= blocked;
        if (blocked > 0) this.game.combatTexts.push(new CombatText(`护盾-${Math.round(blocked)}`, this.x, this.y - 68, '#8fffe9'));
      }
      if (finalAmount <= 0) return;
      this.hp = Math.max(0, this.hp - finalAmount);
      this.hitTimer = 0.18;
      if (this.kind === 'hero' && this.recallTimer > 0) {
        this.recallTimer = 0;
        if (this.isPlayer) this.game.pushMessage('回城被伤害打断。', '#ffb0bd');
      }
      this.game.combatTexts.push(new CombatText(`-${Math.round(finalAmount)}`, this.x, this.y - 56, this.team === BLUE ? '#ff8fa3' : '#8fffe9'));
      if (this.hp <= 0) this.die(source);
    }

    die(source) {
      if (this.dead) return;
      this.dead = true;
      this.hp = 0;
      this.deathTimer = 0.9;
      this.target = null;
      this.game.handleDeath(this, source);
    }

    faceToward(target) {
      this.direction = directionRow(target.x - this.x, target.y - this.y);
    }

    moveToward(point, speed, dt) {
      const dx = point.x - this.x;
      const dy = point.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 4) {
        this.moving = false;
        return true;
      }
      const step = Math.min(dist, speed * dt);
      this.x += dx / dist * step;
      this.y += dy / dist * step;
      this.direction = directionRow(dx, dy);
      this.moving = true;
      return dist <= step + 4;
    }
  }

  class Hero extends Unit {
    constructor(game, options) {
      super(game, {
        kind: 'hero',
        radius: 26,
        maxHp: options.team === BLUE ? 920 : 840,
        maxMp: 380,
        attackDamage: options.team === BLUE ? 62 : 54,
        attackRange: 78,
        attackInterval: 0.82,
        speed: options.team === BLUE ? 164 : 152,
        spellPower: 0,
        ...options,
      });
      this.mp = this.maxMp;
      this.level = 1;
      this.xp = 0;
      this.xpNeeded = 120;
      this.gold = options.team === BLUE ? 420 : 300;
      this.cs = 0;
      this.skillPoints = 0;
      this.inventory = [null, null, null, null];
      this.moveTarget = null;
      this.attackTarget = null;
      this.attackMove = false;
      this.action = 'idle';
      this.actionLock = 0;
      this.animTime = 0;
      this.deathAnim = 0;
      this.respawnTimer = 0;
      this.shield = 0;
      this.shieldTimer = 0;
      this.recallTimer = 0;
      this.empoweredTimer = 0;
      this.skills = {
        q: { key: 'Q', name: '裂弧斩', level: 1, max: 5, cooldown: 0, lastCooldown: 5.2, cost: 42, base: 5.2 },
        w: { key: 'W', name: '辉光护盾', level: 1, max: 5, cooldown: 0, lastCooldown: 9, cost: 48, base: 9 },
        e: { key: 'E', name: '踏星突进', level: 1, max: 5, cooldown: 0, lastCooldown: 8.2, cost: 44, base: 8.2 },
        r: { key: 'R', name: '秘源震荡', level: 0, max: 3, cooldown: 0, lastCooldown: 28, cost: 100, base: 28 },
      };
    }

    update(dt) {
      this.animTime += dt;
      if (this.dead) {
        this.deathAnim += dt;
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) this.respawn();
        return;
      }

      this.mp = Math.min(this.maxMp, this.mp + dt * 7);
      this.attackCooldown = Math.max(0, this.attackCooldown - dt);
      this.hitTimer = Math.max(0, this.hitTimer - dt);
      this.actionLock = Math.max(0, this.actionLock - dt);
      this.empoweredTimer = Math.max(0, this.empoweredTimer - dt);
      if (this.shieldTimer > 0) {
        this.shieldTimer -= dt;
        if (this.shieldTimer <= 0) this.shield = 0;
      }
      for (const skill of Object.values(this.skills)) skill.cooldown = Math.max(0, skill.cooldown - dt);

      if (this.recallTimer > 0) {
        this.recallTimer -= dt;
        this.action = 'idle';
        this.moving = false;
        if (this.recallTimer <= 0) this.finishRecall();
        return;
      }

      if (this.isPlayer) this.updatePlayer(dt);
      else this.updateAI(dt);
    }

    updatePlayer(dt) {
      if (this.attackMove && !this.attackTarget) {
        const nearest = this.game.findNearestEnemy(this, 245);
        if (nearest) this.attackTarget = nearest;
      }
      if (this.attackTarget && !this.game.isAttackable(this, this.attackTarget)) this.attackTarget = null;
      if (this.attackTarget) {
        this.chaseAndAttack(this.attackTarget, dt);
        return;
      }
      if (this.moveTarget) {
        if (this.moveToward(this.moveTarget, this.speed, dt)) {
          this.moveTarget = null;
          this.attackMove = false;
        }
        this.action = this.moving ? 'move' : 'idle';
        return;
      }
      this.moving = false;
      this.action = 'idle';
    }

    updateAI(dt) {
      const player = this.game.player;
      const safe = this.game.getSafePoint(this.team);
      if (hpRatio(this) < 0.34 && distance(this, safe) > 80) {
        this.attackTarget = null;
        this.moveToward(safe, this.speed * 1.08, dt);
        this.action = 'move';
        return;
      }

      const lowMinion = this.game.minions
        .filter(m => !m.dead && m.team !== this.team && distance(this, m) < 335 && m.hp < this.attackDamage + 24)
        .sort((a, b) => a.hp - b.hp)[0];
      const canTrade = this.game.isAlive(player) && distance(this, player) < 230 && hpRatio(this) > 0.48 && hpRatio(player) < 0.78;
      const nearestMinion = this.game.minions
        .filter(m => !m.dead && m.team !== this.team)
        .sort((a, b) => distance(this, a) - distance(this, b))[0];

      if (lowMinion) this.attackTarget = lowMinion;
      else if (canTrade) this.attackTarget = player;
      else if (!this.attackTarget || !this.game.isAttackable(this, this.attackTarget)) this.attackTarget = nearestMinion || this.game.getPrimaryBuildingTarget(this.team);

      if (this.attackTarget) {
        this.chaseAndAttack(this.attackTarget, dt);
      } else {
        const pushPoint = pointOnPath(this.team === BLUE ? 0.42 : 0.58);
        this.moveToward(pushPoint, this.speed * 0.75, dt);
        this.action = this.moving ? 'move' : 'idle';
      }
    }

    chaseAndAttack(target, dt) {
      const range = this.attackRange + target.radius;
      if (distance(this, target) <= range) {
        this.moving = false;
        this.faceToward(target);
        this.action = this.actionLock > 0 ? this.action : 'idle';
        if (this.attackCooldown <= 0) this.basicAttack(target);
        return;
      }
      this.moveToward(target, this.speed, dt);
      this.action = 'move';
    }

    basicAttack(target) {
      if (!this.game.isAttackable(this, target)) return;
      this.attackCooldown = this.attackInterval;
      this.action = 'attack';
      this.actionLock = 0.34;
      this.faceToward(target);
      let damage = this.attackDamage;
      if (this.empoweredTimer > 0) {
        damage += 44 + this.level * 8;
        this.empoweredTimer = 0;
        this.game.effects.push(new Effect({ type: 'spark', x: target.x, y: target.y - 20, color: TEAM_STYLE[this.team].main, radius: 42, life: 0.38 }));
      }
      this.game.effects.push(new Effect({ type: 'slash', x: target.x, y: target.y - 18, angle: Math.atan2(target.y - this.y, target.x - this.x), color: TEAM_STYLE[this.team].main, radius: 38, life: 0.22 }));
      this.game.applyDamage(target, damage, this, { sourceKind: 'attack' });
    }

    addXp(amount) {
      if (this.dead) return;
      this.xp += amount;
      while (this.xp >= this.xpNeeded && this.level < 18) {
        this.xp -= this.xpNeeded;
        this.level += 1;
        this.skillPoints += 1;
        this.xpNeeded = Math.floor(105 + this.level * 82);
        this.maxHp += 76;
        this.hp += 76;
        this.maxMp += 32;
        this.mp += 32;
        this.attackDamage += 5;
        this.game.pushMessage(`等级提升到 ${this.level}，获得 1 个技能点。`, '#ffe599');
        this.game.effects.push(new Effect({ type: 'ring', x: this.x, y: this.y, color: '#ffe599', radius: 92, life: 0.8 }));
      }
    }

    die(source) {
      if (this.dead) return;
      super.die(source);
      this.action = 'death';
      this.deathAnim = 0;
      this.respawnTimer = 5 + this.level * 2;
      this.attackTarget = null;
      this.moveTarget = null;
      this.recallTimer = 0;
    }

    respawn() {
      const spawn = this.game.getSpawnPoint(this.team);
      this.dead = false;
      this.hp = this.maxHp;
      this.mp = this.maxMp;
      this.x = spawn.x;
      this.y = spawn.y;
      this.direction = this.team === BLUE ? 3 : 7;
      this.action = 'idle';
      this.deathAnim = 0;
      this.game.effects.push(new Effect({ type: 'ring', x: this.x, y: this.y, color: TEAM_STYLE[this.team].main, radius: 90, life: 0.75 }));
      if (this.isPlayer) this.game.pushMessage('你已在己方基地复活。', '#8fffe9');
    }

    finishRecall() {
      const spawn = this.game.getSpawnPoint(this.team);
      this.x = spawn.x;
      this.y = spawn.y;
      this.hp = this.maxHp;
      this.mp = this.maxMp;
      this.moveTarget = null;
      this.attackTarget = null;
      this.attackMove = false;
      this.game.effects.push(new Effect({ type: 'ring', x: this.x, y: this.y, color: '#8fffe9', radius: 96, life: 0.65 }));
      if (this.isPlayer) this.game.pushMessage('回城完成，生命和法力已恢复。', '#8fffe9');
    }
  }

  class Minion extends Unit {
    constructor(game, options) {
      const stats = {
        melee: { maxHp: 190, attackDamage: 18, attackRange: 34, speed: 48, reward: 24, xp: 28, radius: 16, attackInterval: 1.05 },
        ranged: { maxHp: 118, attackDamage: 14, attackRange: 158, speed: 43, reward: 18, xp: 23, radius: 14, attackInterval: 1.2 },
        siege: { maxHp: 330, attackDamage: 38, attackRange: 176, speed: 34, reward: 48, xp: 48, radius: 20, attackInterval: 1.55 },
      }[options.type];
      super(game, {
        kind: 'minion',
        ...stats,
        ...options,
      });
      this.path = options.team === BLUE ? LANE_PATH : [...LANE_PATH].reverse();
      this.waypoint = 1;
      this.attackCooldown = 0.3 + Math.random() * 0.4;
    }

    update(dt) {
      if (this.dead) {
        this.deathTimer -= dt;
        return;
      }
      this.attackCooldown = Math.max(0, this.attackCooldown - dt);
      this.hitTimer = Math.max(0, this.hitTimer - dt);
      if (!this.target || !this.game.isAttackable(this, this.target) || distance(this, this.target) > this.attackRange + this.target.radius + 26) {
        this.target = this.chooseTarget();
      }
      if (this.target && distance(this, this.target) <= this.attackRange + this.target.radius) {
        this.moving = false;
        this.faceToward(this.target);
        if (this.attackCooldown <= 0) this.attack(this.target);
        return;
      }
      const goal = this.path[this.waypoint] || this.path[this.path.length - 1];
      if (this.moveToward(goal, this.speed, dt) && this.waypoint < this.path.length - 1) this.waypoint += 1;
    }

    chooseTarget() {
      const enemyMinions = this.game.minions
        .filter(m => !m.dead && m.team !== this.team && distance(this, m) <= this.attackRange + m.radius + 42)
        .sort((a, b) => distance(this, a) - distance(this, b));
      if (enemyMinions[0]) return enemyMinions[0];

      const enemyHero = this.game.heroes
        .filter(h => !h.dead && h.team !== this.team && distance(this, h) <= this.attackRange + h.radius)
        .sort((a, b) => distance(this, a) - distance(this, b))[0];
      if (enemyHero) return enemyHero;

      const building = this.game.getPrimaryBuildingTarget(this.team);
      if (building && distance(this, building) <= this.attackRange + building.radius) return building;
      return null;
    }

    attack(target) {
      this.attackCooldown = this.attackInterval;
      this.faceToward(target);
      const color = TEAM_STYLE[this.team].main;
      const damage = this.type === 'siege' && target.kind === 'building' ? this.attackDamage * 1.65 : this.attackDamage;
      if (this.type === 'ranged' || this.type === 'siege') {
        this.game.projectiles.push(new Projectile(this.game, {
          source: this,
          target,
          x: this.x,
          y: this.y - 24,
          damage,
          color,
          radius: this.type === 'siege' ? 7 : 5,
          speed: this.type === 'siege' ? 330 : 390,
          flags: { sourceKind: 'minion' },
        }));
      } else {
        this.game.effects.push(new Effect({ type: 'slash', x: target.x, y: target.y - 12, angle: Math.atan2(target.y - this.y, target.x - this.x), color, radius: 24, life: 0.18 }));
        this.game.applyDamage(target, damage, this, { sourceKind: 'minion' });
      }
    }
  }

  class Building extends Unit {
    constructor(game, options) {
      super(game, {
        kind: 'building',
        radius: options.type === 'core' ? 58 : 44,
        maxHp: options.type === 'core' ? 1800 : 1120,
        attackRange: options.type === 'core' ? 170 : 238,
        attackDamage: options.type === 'core' ? 65 : 96,
        attackInterval: options.type === 'core' ? 1.9 : 1.35,
        ...options,
      });
      this.type = options.type;
      this.ySort = this.y + (this.type === 'tower' ? 34 : 28);
    }

    update(dt) {
      if (this.dead) return;
      this.attackCooldown = Math.max(0, this.attackCooldown - dt);
      if (this.attackCooldown > 0) return;
      const target = this.chooseTarget();
      if (!target) return;
      this.attackCooldown = this.attackInterval;
      const color = TEAM_STYLE[this.team].main;
      this.game.projectiles.push(new Projectile(this.game, {
        source: this,
        target,
        x: this.x,
        y: this.y - (this.type === 'tower' ? 108 : 56),
        damage: this.attackDamage,
        color,
        radius: this.type === 'tower' ? 9 : 7,
        speed: this.type === 'tower' ? 540 : 430,
        flags: { sourceKind: this.type },
      }));
      this.game.effects.push(new Effect({ type: 'ring', x: this.x, y: this.y, color, radius: this.attackRange, life: 0.24 }));
    }

    chooseTarget() {
      const enemies = [
        ...this.game.minions.filter(m => !m.dead && m.team !== this.team),
        ...this.game.heroes.filter(h => !h.dead && h.team !== this.team),
      ].filter(e => distance(this, e) <= this.attackRange + e.radius);
      const minion = enemies.filter(e => e.kind === 'minion').sort((a, b) => distance(this, a) - distance(this, b))[0];
      if (minion) return minion;
      return enemies.filter(e => e.kind === 'hero').sort((a, b) => distance(this, a) - distance(this, b))[0] || null;
    }

    die(source) {
      if (this.dead) return;
      super.die(source);
      this.deathTimer = 999;
    }
  }

  class AetherlineGame {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.mouse = { x: WIDTH / 2, y: HEIGHT / 2 };
      this.assets = {};
      this.assetsReady = false;
      this.ready = false;
      this.lastTime = 0;
      this.paused = false;
      this.nextId = 0;
      this.bindInput();
      this.drawLoading();
    }

    start() {
      this.loadAssets().then(() => {
        this.assetsReady = true;
        this.ready = true;
        this.reset();
        this.lastTime = performance.now();
        requestAnimationFrame(time => this.loop(time));
      });
    }

    loadAssets() {
      const entries = [
        ['background', BACKGROUND_PATH],
        ['objects', OBJECT_SHEET_PATH],
        ['buildings', BUILDING_SHEET_PATH],
        ['icons', ICON_SHEET_PATH],
        ['minions', MINION_SHEET_PATH],
        ['minionDirections', MINION_DIRECTION_SHEET_PATH],
        ['effects', EFFECT_SHEET_PATH],
        ...Object.entries(SPRITE_PATHS),
        ...Object.entries(ENEMY_SPRITE_PATHS).map(([key, src]) => [`enemy-${key}`, src]),
      ];
      return Promise.all(entries.map(([key, src]) => new Promise(resolve => {
        const img = new Image();
        img.onload = () => { this.assets[key] = img; resolve(); };
        img.onerror = () => { this.assets[key] = null; resolve(); };
        img.src = src;
      })));
    }

    reset() {
      this.nextId = 0;
      this.time = 0;
      this.waveTimer = 8;
      this.waveNumber = 0;
      this.naturalGoldTimer = 0;
      this.gameOver = null;
      this.messages = [];
      this.effects = [];
      this.projectiles = [];
      this.combatTexts = [];
      this.score = { blueKills: 0, redKills: 0 };
      const playerStart = pointOnPath(0.49);
      const enemyStart = pointOnPath(0.67);
      this.player = new Hero(this, {
        team: BLUE,
        name: '秘源守卫',
        x: playerStart.x - playerStart.nx * 38,
        y: playerStart.y - playerStart.ny * 38,
        isPlayer: true,
      });
      this.enemy = new Hero(this, {
        team: RED,
        name: '裂隙斗士',
        x: enemyStart.x + enemyStart.nx * 42,
        y: enemyStart.y + enemyStart.ny * 42,
        isPlayer: false,
      });
      this.heroes = [this.player, this.enemy];
      this.minions = [];
      this.buildings = [
        new Building(this, { team: BLUE, type: 'core', name: '己方秘源核心', x: 112, y: 626 }),
        new Building(this, { team: BLUE, type: 'tower', name: '己方防御塔', x: 318, y: 522 }),
        new Building(this, { team: RED, type: 'tower', name: '敌方防御塔', x: 962, y: 192 }),
        new Building(this, { team: RED, type: 'core', name: '敌方秘源核心', x: 1160, y: 86 }),
      ];
      this.decor = this.createDecor();
      this.seedOpeningSkirmish();
      this.player.attackMove = true;
      this.enemy.attackTarget = this.minions.find(minion => minion.team === BLUE) || this.player;
      this.pushMessage('目标：补刀发育，跟随小兵推塔，摧毁敌方秘源核心。', '#d9fff6');
      this.pushMessage('按 Ctrl+Q/W/E/R 消耗技能点升级技能；靠近己方基地按 1-4 买装备。', '#ffe599');
    }

    createDecor() {
      return [
        { type: 'tree', x: 70, y: 260, s: 1.28 },
        { type: 'tree', x: 122, y: 326, s: 0.98 },
        { type: 'tree', x: 1160, y: 344, s: 0.92 },
        { type: 'tree', x: 1090, y: 424, s: 1.12 },
        { type: 'tree', x: 845, y: 96, s: 0.76 },
        { type: 'tree', x: 404, y: 548, s: 0.78 },
        { type: 'brush', x: 178, y: 232, s: 1.15 },
        { type: 'brush', x: 420, y: 438, s: 1.35 },
        { type: 'brush', x: 842, y: 284, s: 1.18 },
        { type: 'brush', x: 1126, y: 234, s: 1.08 },
        { type: 'rock', x: 510, y: 498, s: 1.1 },
        { type: 'rock', x: 754, y: 248, s: 0.95 },
        { type: 'rock', x: 1002, y: 484, s: 0.82 },
        { type: 'ruin', x: 230, y: 374, s: 1 },
        { type: 'ruin', x: 1048, y: 302, s: 0.92 },
        { type: 'wall', x: 185, y: 466, s: 0.95 },
        { type: 'wall', x: 930, y: 122, s: 0.86 },
        { type: 'torch', x: 336, y: 514, s: 1, team: BLUE },
        { type: 'torch', x: 956, y: 186, s: 1, team: RED },
      ];
    }

    loop(now) {
      const dt = Math.min(0.04, Math.max(0, (now - this.lastTime) / 1000));
      this.lastTime = now;
      if (!this.paused) this.update(dt);
      this.render();
      requestAnimationFrame(time => this.loop(time));
    }

    update(dt) {
      if (!this.assetsReady || this.gameOver) {
        this.effects.forEach(e => e.update(dt));
        this.effects = this.effects.filter(e => e.life > 0);
        return;
      }
      this.time += dt;
      this.waveTimer -= dt;
      this.naturalGoldTimer += dt;
      if (this.naturalGoldTimer >= 1) {
        this.naturalGoldTimer -= 1;
        this.player.gold += 1;
      }
      if (this.waveTimer <= 0) {
        this.spawnWave();
        this.waveTimer = 20;
      }

      this.heroes.forEach(hero => hero.update(dt));
      this.minions.forEach(minion => minion.update(dt));
      this.buildings.forEach(building => building.update(dt));
      this.projectiles.forEach(projectile => projectile.update(dt));
      this.effects.forEach(effect => effect.update(dt));
      this.combatTexts.forEach(text => text.update(dt));
      this.messages.forEach(message => { message.life -= dt; });

      this.minions = this.minions.filter(minion => !minion.dead || minion.deathTimer > 0);
      this.projectiles = this.projectiles.filter(projectile => !projectile.dead);
      this.effects = this.effects.filter(effect => effect.life > 0);
      this.combatTexts = this.combatTexts.filter(text => text.life > 0);
      this.messages = this.messages.filter(message => message.life > 0).slice(-7);
    }

    bindInput() {
      this.canvas.addEventListener('contextmenu', event => event.preventDefault());
      this.canvas.addEventListener('mousemove', event => {
        this.mouse = this.toCanvasPoint(event);
      });
      this.canvas.addEventListener('mousedown', event => {
        const point = this.toCanvasPoint(event);
        this.mouse = point;
        if (event.button === 2) {
          event.preventDefault();
          this.handleRightClick(point);
        } else if (event.button === 0) {
          this.handleLeftClick(point);
        }
      });
      window.addEventListener('keydown', event => this.handleKeyDown(event));
    }

    toCanvasPoint(event) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * WIDTH / rect.width,
        y: (event.clientY - rect.top) * HEIGHT / rect.height,
      };
    }

    handleRightClick(point) {
      if (this.gameOver || this.player.dead || point.y > HUD_Y) return;
      const target = this.getEnemyAt(point);
      if (target) {
        this.player.attackTarget = target;
        this.player.moveTarget = null;
        this.player.attackMove = false;
        this.pushMessage(`攻击目标：${target.name || '敌方单位'}`, '#d9fff6');
        return;
      }
      this.orderMove(point, false);
    }

    handleLeftClick(point) {
      if (this.gameOver) {
        this.reset();
        return;
      }
      if (this.isInsideMiniMap(point)) {
        this.orderMove(this.miniToWorld(point), false);
        return;
      }
      const itemIndex = this.itemSlotAt(point);
      if (itemIndex >= 0) this.buyItem(itemIndex);
    }

    handleKeyDown(event) {
      const key = event.key.toLowerCase();
      if (this.gameOver && key === 'enter') {
        event.preventDefault();
        this.reset();
        return;
      }
      if (key === 'escape') {
        this.paused = !this.paused;
        this.pushMessage(this.paused ? '游戏已暂停。' : '游戏继续。', '#ffe599');
        return;
      }
      if (['q', 'w', 'e', 'r'].includes(key)) {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) this.upgradeSkill(key);
        else this.castSkill(key);
        return;
      }
      if (['1', '2', '3', '4'].includes(key)) {
        event.preventDefault();
        this.buyItem(Number(key) - 1);
        return;
      }
      if (key === 'a') {
        event.preventDefault();
        this.orderMove(this.mouse, true);
        this.pushMessage('攻击移动：途中会自动攻击附近敌人。', '#ffe599');
      } else if (key === 's') {
        event.preventDefault();
        this.player.moveTarget = null;
        this.player.attackTarget = null;
        this.player.attackMove = false;
        this.player.recallTimer = 0;
        this.pushMessage('已停止当前指令。', '#d9fff6');
      } else if (key === 'b') {
        event.preventDefault();
        this.startRecall();
      } else if (key === ' ') {
        event.preventDefault();
        this.pushMessage('镜头已锁定玩家英雄。当前原型为单屏战场。', '#d9fff6');
      }
    }

    orderMove(point, attackMove) {
      if (this.player.dead) return;
      const x = clamp(point.x, 70, 1210);
      const y = clamp(point.y, 70, HUD_Y - 28);
      this.player.moveTarget = { x, y };
      this.player.attackTarget = null;
      this.player.attackMove = attackMove;
      this.player.recallTimer = 0;
      this.effects.push(new Effect({ type: 'ring', x, y, color: attackMove ? '#ffe599' : TEAM_STYLE.blue.main, radius: 34, life: 0.42 }));
    }

    castSkill(key) {
      const hero = this.player;
      if (hero.dead) return;
      const skill = hero.skills[key];
      if (!skill || skill.level <= 0) {
        this.pushMessage(key === 'r' ? 'R 需要 6 级后用技能点解锁。' : '该技能尚未学习。', '#ffb0bd');
        return;
      }
      if (skill.cooldown > 0) {
        this.pushMessage(`${skill.name} 还在冷却：${skill.cooldown.toFixed(1)} 秒。`, '#ffb0bd');
        return;
      }
      if (hero.mp < skill.cost) {
        this.pushMessage('法力不足。', '#ffb0bd');
        return;
      }
      hero.mp -= skill.cost;
      const cd = Math.max(1.2, skill.base - (skill.level - 1) * 0.45);
      skill.cooldown = cd;
      skill.lastCooldown = cd;
      hero.action = 'attack';
      hero.actionLock = 0.42;
      hero.recallTimer = 0;
      const targetPoint = hero.attackTarget && this.isAlive(hero.attackTarget) ? hero.attackTarget : this.mouse;
      hero.direction = directionRow(targetPoint.x - hero.x, targetPoint.y - hero.y);

      if (key === 'q') this.castQ(hero, skill, targetPoint);
      if (key === 'w') this.castW(hero, skill);
      if (key === 'e') this.castE(hero, skill, targetPoint);
      if (key === 'r') this.castR(hero, skill, targetPoint);
    }

    castQ(hero, skill, targetPoint) {
      const dir = this.normalized(hero, targetPoint);
      const angle = Math.atan2(dir.y, dir.x);
      const damage = 64 + skill.level * 26 + hero.spellPower * 0.6;
      const enemies = this.getEnemyUnits(hero.team).filter(entity => distance(hero, entity) < 158 + entity.radius);
      let hits = 0;
      enemies.forEach(entity => {
        const dx = entity.x - hero.x;
        const dy = entity.y - hero.y;
        const len = Math.hypot(dx, dy) || 1;
        const dot = (dx / len) * dir.x + (dy / len) * dir.y;
        if (dot > 0.35) {
          hits += 1;
          this.applyDamage(entity, damage, hero, { sourceKind: 'skill' });
        }
      });
      this.effects.push(new Effect({ type: 'slash', x: hero.x + dir.x * 72, y: hero.y + dir.y * 44, angle, color: '#8fffe9', radius: 118, life: 0.34 }));
      this.pushMessage(`裂弧斩命中 ${hits} 个目标。`, '#8fffe9');
    }

    castW(hero, skill) {
      hero.shield = 118 + skill.level * 58 + hero.spellPower;
      hero.shieldTimer = 4.2;
      this.effects.push(new Effect({ type: 'ring', x: hero.x, y: hero.y, color: '#8fffe9', radius: 86, life: 0.72 }));
      this.pushMessage('辉光护盾已展开。', '#8fffe9');
    }

    castE(hero, skill, targetPoint) {
      const dir = this.normalized(hero, targetPoint);
      hero.x = clamp(hero.x + dir.x * (126 + skill.level * 9), 70, 1210);
      hero.y = clamp(hero.y + dir.y * (96 + skill.level * 6), 70, HUD_Y - 30);
      hero.empoweredTimer = 4.5;
      this.effects.push(new Effect({ type: 'dash', x: hero.x - dir.x * 36, y: hero.y - dir.y * 24, angle: Math.atan2(dir.y, dir.x), color: '#ffe599', radius: 74, life: 0.48 }));
      this.pushMessage('踏星突进完成，下一次普攻强化。', '#ffe599');
    }

    castR(hero, skill, targetPoint) {
      const radius = 118 + skill.level * 12;
      const damage = 185 + skill.level * 82 + hero.spellPower;
      const impact = { x: clamp(targetPoint.x, 90, 1190), y: clamp(targetPoint.y, 76, HUD_Y - 36) };
      let hits = 0;
      this.getEnemyUnits(hero.team).forEach(entity => {
        if (distance(impact, entity) <= radius + entity.radius) {
          hits += 1;
          this.applyDamage(entity, damage, hero, { sourceKind: 'ultimate' });
        }
      });
      this.effects.push(new Effect({ type: 'blast', x: impact.x, y: impact.y, color: '#ffe599', radius, life: 0.78 }));
      this.pushMessage(`秘源震荡命中 ${hits} 个目标。`, '#ffe599');
    }

    upgradeSkill(key) {
      const hero = this.player;
      const skill = hero.skills[key];
      if (!skill || hero.dead) return;
      if (hero.skillPoints <= 0) {
        this.pushMessage('没有可用技能点。升级后会获得技能点。', '#ffb0bd');
        return;
      }
      if (key === 'r' && hero.level < 6) {
        this.pushMessage('R 技能需要英雄达到 6 级。', '#ffb0bd');
        return;
      }
      if (skill.level >= skill.max) {
        this.pushMessage(`${skill.name} 已达到最高等级。`, '#ffb0bd');
        return;
      }
      skill.level += 1;
      hero.skillPoints -= 1;
      this.pushMessage(`${skill.name} 升级到 ${skill.level} 级。`, '#ffe599');
    }

    startRecall() {
      const hero = this.player;
      if (hero.dead) return;
      hero.recallTimer = 4.2;
      hero.moveTarget = null;
      hero.attackTarget = null;
      hero.attackMove = false;
      this.pushMessage('开始回城，受到伤害会被打断。', '#8fffe9');
    }

    buyItem(index) {
      const item = ITEMS[index];
      const hero = this.player;
      if (!item || hero.dead) return;
      if (hero.inventory[index]) {
        this.pushMessage(`${hero.inventory[index].name} 已在装备栏中。`, '#ffb0bd');
        return;
      }
      if (distance(hero, this.getBuilding(BLUE, 'core')) > 180) {
        this.pushMessage('需要靠近己方基地核心才能购买装备。', '#ffb0bd');
        return;
      }
      if (hero.gold < item.cost) {
        this.pushMessage(`金币不足，${item.name} 需要 ${item.cost} 金币。`, '#ffb0bd');
        return;
      }
      hero.gold -= item.cost;
      hero.inventory[index] = item;
      item.apply(hero);
      this.pushMessage(`购买 ${item.name}：${item.stat}。`, '#ffe599');
    }

    normalized(from, to) {
      const fallback = rowVector(from.direction);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      if (len < 3) return fallback;
      return { x: dx / len, y: dy / len };
    }

    seedOpeningSkirmish() {
      const formation = ['melee', 'melee', 'melee', 'ranged', 'ranged'];
      this.createMinionFormation(BLUE, 0.55, formation, 3, 0.92);
      this.createMinionFormation(RED, 0.66, formation, 2, 0.92);
    }

    createMinionFormation(team, anchorT, types, waypoint, spread = 1) {
      const forward = team === BLUE ? 1 : -1;
      types.forEach((type, index) => {
        const p = pointOnPath(anchorT - forward * index * 0.018);
        const side = ((index % 3) - 1) * 24 * spread;
        const lead = index < 3 ? 0 : -forward * 18;
        const minion = new Minion(this, {
          team,
          type,
          name: type === 'siege' ? '攻城秘源兵' : type === 'ranged' ? '远程秘源兵' : '近战秘源兵',
          x: p.x + p.nx * side + Math.cos(p.angle) * lead,
          y: p.y + p.ny * side + Math.sin(p.angle) * lead,
        });
        minion.waypoint = waypoint;
        minion.direction = team === BLUE ? 3 : 7;
        this.minions.push(minion);
      });
    }

    spawnWave() {
      this.waveNumber += 1;
      const types = ['melee', 'melee', 'melee', 'ranged', 'ranged', 'ranged'];
      if (this.waveNumber % 3 === 0) types.push('siege');
      [BLUE, RED].forEach(team => {
        const path = team === BLUE ? LANE_PATH : [...LANE_PATH].reverse();
        const start = path[0];
        const next = path[1];
        const dx = next.x - start.x;
        const dy = next.y - start.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        types.forEach((type, index) => {
          const file = index % 3;
          const rank = Math.floor(index / 3);
          const offset = (file - 1) * 28;
          const trail = 16 + rank * 54 + file * 9;
          this.minions.push(new Minion(this, {
            team,
            type,
            name: type === 'siege' ? '攻城秘源兵' : type === 'ranged' ? '远程秘源兵' : '近战秘源兵',
            x: start.x + nx * offset - dx / len * trail,
            y: start.y + ny * offset - dy / len * trail,
          }));
        });
      });
      this.pushMessage(`第 ${this.waveNumber} 波小兵已出发。`, '#d9fff6');
    }

    applyDamage(target, amount, source, flags = {}) {
      if (!this.isAlive(target) || !source) return;
      let finalAmount = amount;
      if (target.kind === 'building' && target.type === 'core' && this.getBuilding(target.team, 'tower') && !this.getBuilding(target.team, 'tower').dead) {
        finalAmount *= 0.22;
        if (source.isPlayer) this.pushMessage('敌方核心受防御塔护盾保护，先推掉防御塔伤害更高。', '#ffb0bd');
      }
      if (flags.sourceKind === 'tower' && target.kind === 'hero') finalAmount *= 1.15;
      target.takeDamage(finalAmount, source);
    }

    handleDeath(victim, source) {
      const killerTeam = source?.team;
      this.effects.push(new Effect({ type: 'spark', x: victim.x, y: victim.y - 20, color: '#ffffff', radius: 52, life: 0.45 }));
      if (victim.kind === 'minion') {
        if (victim.team === RED && distance(this.player, victim) < 430 && !this.player.dead) this.player.addXp(victim.xp);
        if (source === this.player) {
          this.player.gold += victim.reward;
          this.player.cs += 1;
          this.pushMessage(`补刀 +${victim.reward} 金币。`, '#ffe599');
        }
        if (source === this.enemy) this.enemy.gold += victim.reward;
        return;
      }
      if (victim.kind === 'hero') {
        if (killerTeam === BLUE) {
          this.score.blueKills += 1;
          this.player.gold += victim === this.enemy ? 260 : 0;
          this.player.addXp(victim === this.enemy ? 150 : 0);
          this.pushMessage('击败敌方英雄，获得 260 金币。', '#ffe599');
        } else if (killerTeam === RED) {
          this.score.redKills += 1;
          this.pushMessage('你已阵亡，等待复活倒计时。', '#ffb0bd');
        }
        return;
      }
      if (victim.kind === 'building') {
        const teamName = victim.team === BLUE ? '己方' : '敌方';
        if (victim.type === 'tower') {
          this.pushMessage(`${teamName}防御塔已被摧毁。`, victim.team === RED ? '#ffe599' : '#ffb0bd');
          if (victim.team === RED && killerTeam === BLUE) {
            this.player.gold += 320;
            this.player.addXp(120);
          }
        } else {
          this.gameOver = victim.team === RED ? 'victory' : 'defeat';
          this.pushMessage(victim.team === RED ? '胜利！敌方秘源核心已摧毁。' : '失败！己方秘源核心已摧毁。', victim.team === RED ? '#ffe599' : '#ffb0bd');
        }
      }
    }

    pushMessage(text, color = '#d9fff6') {
      this.messages.push({ text, color, life: 7.5 });
      this.messages = this.messages.slice(-8);
    }

    isAlive(entity) {
      return entity && !entity.dead && entity.hp > 0;
    }

    isAttackable(attacker, target) {
      return this.isAlive(attacker) && this.isAlive(target) && attacker.team !== target.team;
    }

    findNearestEnemy(unit, range) {
      return this.getEnemyUnits(unit.team)
        .filter(entity => distance(unit, entity) <= range + entity.radius)
        .sort((a, b) => distance(unit, a) - distance(unit, b))[0] || null;
    }

    getEnemyUnits(team) {
      return [
        ...this.minions.filter(m => !m.dead && m.team !== team),
        ...this.heroes.filter(h => !h.dead && h.team !== team),
        ...this.buildings.filter(b => !b.dead && b.team !== team),
      ];
    }

    getEnemyAt(point) {
      const enemies = this.getEnemyUnits(BLUE)
        .map(entity => ({ entity, d: distance(point, entity), radius: entity.kind === 'building' ? entity.radius + 30 : entity.radius + 18 }))
        .filter(item => item.d <= item.radius)
        .sort((a, b) => a.d - b.d);
      return enemies[0]?.entity || null;
    }

    getBuilding(team, type) {
      return this.buildings.find(building => building.team === team && building.type === type);
    }

    getPrimaryBuildingTarget(team) {
      const enemy = otherTeam(team);
      const tower = this.getBuilding(enemy, 'tower');
      if (tower && !tower.dead) return tower;
      const core = this.getBuilding(enemy, 'core');
      return core && !core.dead ? core : null;
    }

    getSpawnPoint(team) {
      return team === BLUE ? { x: 188, y: 574 } : { x: 1048, y: 164 };
    }

    getSafePoint(team) {
      return team === BLUE ? { x: 260, y: 540 } : { x: 1012, y: 170 };
    }

    isInsideMiniMap(point) {
      const map = this.miniMapRect();
      return point.x >= map.x && point.x <= map.x + map.w && point.y >= map.y && point.y <= map.y + map.h;
    }

    miniMapRect() {
      return { x: 1032, y: 476, w: 198, h: 198 };
    }

    worldToMini(entity) {
      const map = this.miniMapRect();
      return {
        x: map.x + (entity.x - 60) / 1160 * map.w,
        y: map.y + (entity.y - 55) / 575 * map.h,
      };
    }

    miniToWorld(point) {
      const map = this.miniMapRect();
      return {
        x: 60 + (point.x - map.x) / map.w * 1160,
        y: 55 + (point.y - map.y) / map.h * 575,
      };
    }

    itemSlotAt(point) {
      const startX = 760;
      const y = 646;
      for (let i = 0; i < 4; i += 1) {
        const x = startX + i * 48;
        if (point.x >= x && point.x <= x + 42 && point.y >= y && point.y <= y + 42) return i;
      }
      return -1;
    }

    drawLoading() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#071010';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      drawText(ctx, '正在装载秘源战场与 8 方向精灵图...', WIDTH / 2, HEIGHT / 2, 24, '#8fffe9', 'center', '900');
    }

    drawSheetCell(ctx, image, cell, x, y, width, height) {
      if (!image || cell === undefined) return false;
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        image,
        (cell % ART_COLUMNS) * ART_CELL,
        Math.floor(cell / ART_COLUMNS) * ART_CELL,
        ART_CELL,
        ART_CELL,
        x,
        y,
        width,
        height,
      );
      ctx.imageSmoothingEnabled = smoothing;
      return true;
    }

    drawBuildingSheetCell(ctx, image, cell, x, y, width, height) {
      if (!image || cell === undefined) return false;
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        image,
        (cell % BUILDING_COLUMNS) * BUILDING_CELL,
        Math.floor(cell / BUILDING_COLUMNS) * BUILDING_CELL,
        BUILDING_CELL,
        BUILDING_CELL,
        x,
        y,
        width,
        height,
      );
      ctx.imageSmoothingEnabled = smoothing;
      return true;
    }

    drawAnimCell(ctx, image, row, frame, x, y, width, height) {
      if (!image || row === undefined) return false;
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        image,
        (frame % ANIM_COLUMNS) * ANIM_CELL,
        row * ANIM_CELL,
        ANIM_CELL,
        ANIM_CELL,
        x,
        y,
        width,
        height,
      );
      ctx.imageSmoothingEnabled = smoothing;
      return true;
    }

    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      this.drawWorld(ctx);
      this.drawSceneGrade(ctx);
      this.drawHUD(ctx);
      this.combatTexts.forEach(text => text.draw(ctx));
      if (this.paused) this.drawCenterOverlay(ctx, '暂停', '按 Esc 继续游戏');
      if (this.gameOver) this.drawCenterOverlay(ctx, this.gameOver === 'victory' ? '胜利' : '失败', '按 Enter 或点击画面重新开始');
    }

    drawSceneGrade(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      const fieldTone = ctx.createLinearGradient(0, 0, WIDTH, HUD_Y);
      fieldTone.addColorStop(0, 'rgba(2, 7, 8, .42)');
      fieldTone.addColorStop(0.46, 'rgba(9, 18, 14, .2)');
      fieldTone.addColorStop(1, 'rgba(3, 4, 6, .56)');
      ctx.fillStyle = fieldTone;
      ctx.fillRect(0, 0, WIDTH, HUD_Y);
      ctx.globalCompositeOperation = 'screen';
      const blueBloom = ctx.createRadialGradient(240, 520, 22, 240, 520, 270);
      blueBloom.addColorStop(0, 'rgba(54, 215, 232, .16)');
      blueBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = blueBloom;
      ctx.fillRect(0, 0, WIDTH, HUD_Y);
      const redBloom = ctx.createRadialGradient(1028, 142, 20, 1028, 142, 260);
      redBloom.addColorStop(0, 'rgba(255, 56, 95, .15)');
      redBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = redBloom;
      ctx.fillRect(0, 0, WIDTH, HUD_Y);
      const gameplayLight = ctx.createRadialGradient(680, 330, 45, 680, 330, 390);
      gameplayLight.addColorStop(0, 'rgba(214, 188, 116, .05)');
      gameplayLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gameplayLight;
      ctx.fillRect(0, 0, WIDTH, HUD_Y);
      ctx.globalCompositeOperation = 'source-over';
      const fog = ctx.createLinearGradient(0, 84, WIDTH, 468);
      fog.addColorStop(0, 'rgba(166, 219, 205, .035)');
      fog.addColorStop(0.52, 'rgba(0, 0, 0, 0)');
      fog.addColorStop(1, 'rgba(151, 180, 171, .025)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, WIDTH, HUD_Y);
      ctx.fillStyle = 'rgba(0, 0, 0, .08)';
      for (let y = 0; y < HUD_Y; y += 4) ctx.fillRect(0, y, WIDTH, 1);
      ctx.restore();
    }

    drawWorld(ctx) {
      this.drawTerrain(ctx);
      this.effects.filter(effect => effect.type === 'ring' || effect.type === 'blast').forEach(effect => effect.draw(ctx, this.assets.effects));

      const visibleDecor = this.assets.background ? this.decor.filter(item => item.type === 'torch') : this.decor;
      const drawables = [
        ...visibleDecor.map(item => ({ y: item.y, draw: () => this.drawDecor(ctx, item) })),
        ...this.buildings.map(item => ({ y: item.ySort || item.y, draw: () => this.drawBuilding(ctx, item) })),
        ...this.minions.map(item => ({ y: item.y, draw: () => this.drawMinion(ctx, item) })),
        ...this.heroes.map(item => ({ y: item.y, draw: () => this.drawHero(ctx, item) })),
      ].sort((a, b) => a.y - b.y);
      drawables.forEach(item => item.draw());

      this.projectiles.forEach(projectile => projectile.draw(ctx, this.assets.effects));
      this.effects.filter(effect => effect.type === 'slash' || effect.type === 'spark' || effect.type === 'dash').forEach(effect => effect.draw(ctx, this.assets.effects));
      this.drawCursorIntent(ctx);
    }

    drawTerrain(ctx) {
      const background = this.assets.background;
      const usesGeneratedBackground = Boolean(background);

      if (usesGeneratedBackground) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        const sourceRatio = background.width / background.height;
        const targetRatio = WIDTH / HUD_Y;
        let sx = 0;
        let sy = 0;
        let sw = background.width;
        let sh = background.height;
        if (sourceRatio > targetRatio) {
          sw = background.height * targetRatio;
          sx = (background.width - sw) / 2;
        } else {
          sh = background.width / targetRatio;
          sy = clamp((background.height - sh) * 0.42, 0, background.height - sh);
        }
        ctx.filter = 'saturate(.58) brightness(.66) contrast(1.22)';
        ctx.drawImage(background, sx, sy, sw, sh, 0, 0, WIDTH, HUD_Y);
        ctx.filter = 'none';
        ctx.imageSmoothingEnabled = false;
        const depthTint = ctx.createLinearGradient(0, 0, WIDTH, HUD_Y);
        depthTint.addColorStop(0, 'rgba(2, 8, 9, .42)');
        depthTint.addColorStop(0.5, 'rgba(45, 42, 27, .08)');
        depthTint.addColorStop(1, 'rgba(5, 5, 7, .52)');
        ctx.fillStyle = depthTint;
        ctx.fillRect(0, 0, WIDTH, HUD_Y);
        const laneFocus = ctx.createRadialGradient(682, 330, 72, 682, 330, 520);
        laneFocus.addColorStop(0, 'rgba(206, 180, 105, .055)');
        laneFocus.addColorStop(0.42, 'rgba(0, 0, 0, 0)');
        laneFocus.addColorStop(1, 'rgba(0, 0, 0, .48)');
        ctx.fillStyle = laneFocus;
        ctx.fillRect(0, 0, WIDTH, HUD_Y);
        ctx.restore();
      } else {
        const grass = ctx.createLinearGradient(0, 0, WIDTH, HUD_Y);
        grass.addColorStop(0, '#4f6c3c');
        grass.addColorStop(0.28, '#3d6338');
        grass.addColorStop(0.58, '#315439');
        grass.addColorStop(1, '#223c31');
        ctx.fillStyle = grass;
        ctx.fillRect(0, 0, WIDTH, HUD_Y);

        ctx.save();
        const upperSlope = ctx.createLinearGradient(0, 20, 980, 360);
        upperSlope.addColorStop(0, 'rgba(29, 54, 46, .78)');
        upperSlope.addColorStop(1, 'rgba(55, 80, 45, .26)');
        ctx.fillStyle = upperSlope;
        ctx.beginPath();
        ctx.moveTo(0, 64);
        ctx.lineTo(468, 0);
        ctx.lineTo(1280, 0);
        ctx.lineTo(1280, 96);
        ctx.lineTo(1030, 146);
        ctx.lineTo(780, 232);
        ctx.lineTo(360, 386);
        ctx.lineTo(0, 526);
        ctx.closePath();
        ctx.fill();
        const lowerSlope = ctx.createLinearGradient(190, 580, 1080, 180);
        lowerSlope.addColorStop(0, 'rgba(23, 43, 35, .24)');
        lowerSlope.addColorStop(1, 'rgba(10, 24, 26, .58)');
        ctx.fillStyle = lowerSlope;
        ctx.beginPath();
        ctx.moveTo(0, 496);
        ctx.lineTo(330, 408);
        ctx.lineTo(836, 252);
        ctx.lineTo(1280, 118);
        ctx.lineTo(1280, HUD_Y);
        ctx.lineTo(0, HUD_Y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 13, 14, .32)';
        ctx.lineWidth = 22;
        [[62, 112, 430, 16], [850, 578, 1240, 454], [0, 555, 330, 540], [944, 54, 1280, 36]].forEach(([x1, y1, x2, y2]) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });
        ctx.restore();

        ctx.save();
        for (let i = 0; i < 310; i += 1) {
          const x = (i * 83 + Math.floor(seeded(i) * 31)) % WIDTH;
          const y = 24 + ((i * 47 + Math.floor(seeded(i + 4) * 29)) % 550);
          const hue = i % 5 === 0 ? 'rgba(190, 224, 132, .2)' : i % 3 === 0 ? 'rgba(75, 144, 82, .22)' : 'rgba(25, 100, 66, .24)';
          ctx.strokeStyle = hue;
          ctx.lineWidth = i % 7 === 0 ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + ((i % 5) - 2) * 4, y - 10, x + ((i % 7) - 3) * 3, y - 17 - (i % 9));
          ctx.stroke();
        }
        ctx.restore();
      }

      if (usesGeneratedBackground) this.drawPerspectiveLaneGround(ctx);
      const laneOverlayAlpha = usesGeneratedBackground ? 0.16 : 1;

      ctx.save();
      ctx.globalAlpha = laneOverlayAlpha;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      [
        [278, 'rgba(4, 9, 10, .34)'],
        [246, 'rgba(75, 54, 37, .72)'],
        [214, 'rgba(132, 95, 58, .9)'],
        [178, 'rgba(165, 130, 83, .92)'],
        [138, 'rgba(91, 106, 82, .92)'],
        [104, 'rgba(127, 136, 103, .86)'],
      ].forEach(([width, color]) => {
        traceLanePath(ctx);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
      });
      ctx.setLineDash([42, 26]);
      ctx.strokeStyle = 'rgba(245, 229, 174, .24)';
      ctx.lineWidth = 3;
      traceLanePath(ctx);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.save();
      for (let i = 0; i < 42; i += 1) {
        const p = pointOnPath((i + 0.5) / 42);
        const tx = Math.cos(p.angle);
        const ty = Math.sin(p.angle);
        [-1, 1].forEach(side => {
          const edge = 108 + (i % 3) * 5;
          const x = p.x + p.nx * side * edge;
          const y = p.y + p.ny * side * edge;
          ctx.fillStyle = side > 0 ? 'rgba(47, 34, 24, .5)' : 'rgba(201, 164, 98, .22)';
          ctx.beginPath();
          ctx.moveTo(x - tx * 24, y - ty * 24);
          ctx.lineTo(x + tx * 24, y + ty * 24);
          ctx.lineTo(x + tx * 14 + p.nx * side * 18, y + ty * 14 + p.ny * side * 18);
          ctx.lineTo(x - tx * 18 + p.nx * side * 18, y - ty * 18 + p.ny * side * 18);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(245, 225, 165, .15)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
      ctx.restore();

      this.drawLaneEdge(ctx, -106, usesGeneratedBackground ? 'rgba(30, 22, 16, .28)' : 'rgba(30, 22, 16, .62)', usesGeneratedBackground ? 12 : 20);
      this.drawLaneEdge(ctx, 106, usesGeneratedBackground ? 'rgba(30, 22, 16, .28)' : 'rgba(30, 22, 16, .62)', usesGeneratedBackground ? 12 : 20);
      this.drawLaneEdge(ctx, -82, usesGeneratedBackground ? 'rgba(255, 235, 164, .18)' : 'rgba(233, 206, 142, .32)', 4);
      this.drawLaneEdge(ctx, 82, usesGeneratedBackground ? 'rgba(255, 235, 164, .18)' : 'rgba(233, 206, 142, .32)', 4);

      const stoneCount = usesGeneratedBackground ? 34 : 128;
      for (let i = 0; i < stoneCount; i += 1) {
        const p = pointOnPath((i + 0.26) / stoneCount);
        const side = ((i % 7) - 3) * 15 + (seeded(i + 17) - 0.5) * 14;
        const forward = (seeded(i + 31) - 0.5) * 18;
        this.drawStone(ctx, p.x + p.nx * side + Math.cos(p.angle) * forward, p.y + p.ny * side + Math.sin(p.angle) * forward, p.angle, i);
      }

      ctx.save();
      ctx.globalAlpha = usesGeneratedBackground ? 0.42 : 1;
      const grassClusterCount = usesGeneratedBackground ? 18 : 54;
      for (let i = 0; i < grassClusterCount; i += 1) {
        const p = pointOnPath((i + 0.3) / grassClusterCount);
        const side = i % 2 ? 1 : -1;
        const x = p.x + p.nx * side * (126 + (i % 4) * 8);
        const y = p.y + p.ny * side * (126 + (i % 4) * 8);
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        ctx.beginPath();
        ctx.ellipse(x, y + 8, 26, 8, p.angle, 0, Math.PI * 2);
        ctx.fill();
        for (let blade = 0; blade < 5; blade += 1) {
          ctx.strokeStyle = blade % 2 ? 'rgba(73, 147, 75, .72)' : 'rgba(161, 205, 103, .55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 13 + blade * 7, y + 8);
          ctx.quadraticCurveTo(x - 10 + blade * 7 + side * 9, y - 4, x - 14 + blade * 7 + side * 6, y - 22 - blade * 2);
          ctx.stroke();
        }
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = usesGeneratedBackground ? 0.38 : 0.72;
      for (let i = 0; i < 18; i += 1) {
        const p = pointOnPath((i + 0.35) / 18);
        ctx.strokeStyle = i < 9 ? TEAM_STYLE.blue.main : TEAM_STYLE.red.main;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 20;
        ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 22 + (i % 3) * 4, 8 + (i % 2) * 2, p.angle, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      if (usesGeneratedBackground) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        [
          { x: 210, y: 520, r: 132, color: 'rgba(67, 184, 210, .045)' },
          { x: 1060, y: 130, r: 126, color: 'rgba(255, 83, 88, .045)' },
          { x: 690, y: 318, r: 310, color: 'rgba(255, 226, 164, .045)' },
        ].forEach(glow => {
          const teamGlow = ctx.createRadialGradient(glow.x, glow.y, 20, glow.x, glow.y, glow.r);
          teamGlow.addColorStop(0, glow.color);
          teamGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = teamGlow;
          ctx.fillRect(0, 0, WIDTH, HUD_Y);
        });
        ctx.restore();
      }

      const light = ctx.createRadialGradient(620, 318, 40, 620, 318, 660);
      light.addColorStop(0, usesGeneratedBackground ? 'rgba(255, 238, 178, .14)' : 'rgba(255, 246, 194, .18)');
      light.addColorStop(0.48, usesGeneratedBackground ? 'rgba(255, 255, 255, .035)' : 'rgba(255, 255, 255, .03)');
      light.addColorStop(1, usesGeneratedBackground ? 'rgba(0, 0, 0, .18)' : 'rgba(0, 0, 0, .18)');
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, WIDTH, HUD_Y);

      const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 130, WIDTH / 2, HEIGHT / 2, 800);
      vignette.addColorStop(0, 'rgba(255,255,255,0)');
      vignette.addColorStop(0.54, usesGeneratedBackground ? 'rgba(0,0,0,.12)' : 'rgba(0,0,0,.12)');
      vignette.addColorStop(1, usesGeneratedBackground ? 'rgba(0,0,0,.58)' : 'rgba(0,0,0,.27)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, WIDTH, HUD_Y);

      if (usesGeneratedBackground) {
        ctx.save();
        const edgeDark = ctx.createLinearGradient(0, 0, WIDTH, HUD_Y);
        edgeDark.addColorStop(0, 'rgba(1, 7, 10, .38)');
        edgeDark.addColorStop(0.28, 'rgba(1, 7, 10, .04)');
        edgeDark.addColorStop(0.72, 'rgba(1, 7, 10, .05)');
        edgeDark.addColorStop(1, 'rgba(1, 7, 10, .34)');
        ctx.fillStyle = edgeDark;
        ctx.fillRect(0, 0, WIDTH, HUD_Y);
        ctx.restore();
      }
    }

    drawPerspectiveLaneGround(ctx) {
      ctx.save();
      const steps = 28;
      const left = [];
      const right = [];
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const p = pointOnPath(t);
        const width = lerp(112, 72, t) + Math.sin(t * Math.PI) * 20;
        left.push({ x: p.x + p.nx * width, y: p.y + p.ny * width });
        right.push({ x: p.x - p.nx * width, y: p.y - p.ny * width });
      }
      ctx.beginPath();
      left.forEach((p, index) => {
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      right.reverse().forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      const laneShade = ctx.createLinearGradient(160, 560, 1120, 96);
      laneShade.addColorStop(0, 'rgba(105, 97, 70, .2)');
      laneShade.addColorStop(0.46, 'rgba(128, 118, 78, .13)');
      laneShade.addColorStop(1, 'rgba(23, 13, 17, .36)');
      ctx.fillStyle = laneShade;
      ctx.fill();
      ctx.strokeStyle = 'rgba(2, 4, 5, .46)';
      ctx.lineWidth = 16;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 232, 162, .18)';
      ctx.lineWidth = 3;
      ctx.setLineDash([30, 18]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    drawLaneEdge(ctx, offset, color, width) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 34; i += 1) {
        const p = pointOnPath(i / 34);
        const x = p.x + p.nx * offset;
        const y = p.y + p.ny * offset;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    drawStone(ctx, x, y, angle, index) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + (seeded(index) - 0.5) * 0.24);
      const w = 26 + (index % 6) * 6 + seeded(index + 9) * 8;
      const h = 12 + (index % 5) * 3 + seeded(index + 15) * 4;
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath();
      ctx.ellipse(2, h * 0.35, w * 0.48, h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(-w * 0.24, -h / 2);
      ctx.lineTo(w * 0.33, -h * 0.46);
      ctx.lineTo(w / 2, h * 0.02);
      ctx.lineTo(w * 0.16, h / 2);
      ctx.lineTo(-w * 0.4, h * 0.36);
      ctx.closePath();
      ctx.fillStyle = index % 3 === 0 ? '#9a9271' : index % 3 === 1 ? '#7f866e' : '#6f7c68';
      ctx.fill();
      ctx.strokeStyle = 'rgba(20,17,12,.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 0.48;
      ctx.strokeStyle = 'rgba(246, 230, 168, .58)';
      ctx.beginPath();
      ctx.moveTo(-w * 0.28, -h * 0.08);
      ctx.lineTo(w * 0.22, h * 0.02);
      ctx.stroke();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = 'rgba(29, 38, 31, .9)';
      ctx.beginPath();
      ctx.moveTo(-w * 0.06, -h * 0.38);
      ctx.lineTo(w * 0.12, h * 0.36);
      ctx.stroke();
      ctx.restore();
    }

    drawDecor(ctx, item) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(item.s, item.s);
      const decorCell = item.type === 'torch'
        ? OBJECT_CELLS.decor[item.team === RED ? 'torchRed' : 'torchBlue']
        : OBJECT_CELLS.decor[item.type];
      if (this.assets.objects && decorCell !== undefined) {
        const box = {
          tree: { x: -63, y: -138, w: 126, h: 156, shadow: [0, 18, 42, 14] },
          brush: { x: -68, y: -76, w: 136, h: 86, shadow: [0, 10, 62, 18] },
          rock: { x: -58, y: -74, w: 116, h: 88, shadow: [0, 16, 42, 14] },
          ruin: { x: -64, y: -80, w: 128, h: 94, shadow: [0, 20, 52, 16] },
          wall: { x: -64, y: -80, w: 128, h: 94, shadow: [0, 20, 58, 16] },
          torch: { x: -37, y: -96, w: 74, h: 108, shadow: [0, 14, 30, 10] },
        }[item.type] || { x: -58, y: -78, w: 116, h: 96, shadow: [0, 18, 48, 16] };
        ctx.fillStyle = 'rgba(0,0,0,.28)';
        ctx.beginPath();
        ctx.ellipse(...box.shadow, 0, 0, Math.PI * 2);
        ctx.fill();
        this.drawSheetCell(ctx, this.assets.objects, decorCell, box.x, box.y, box.w, box.h);
        ctx.restore();
        return;
      }
      if (item.type === 'tree') {
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 38, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#604629';
        ctx.fillRect(-6, -34, 12, 52);
        ['#143321', '#1d4a2b', '#2f7040'].forEach((color, index) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(0, -96 + index * 18);
          ctx.lineTo(-42 + index * 6, -16 + index * 10);
          ctx.lineTo(42 - index * 6, -16 + index * 10);
          ctx.closePath();
          ctx.fill();
        });
      } else if (item.type === 'brush') {
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 62, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 18; i += 1) {
          const x = -52 + i * 6;
          const h = 26 + (i % 5) * 6;
          ctx.strokeStyle = i % 2 ? '#2e7142' : '#245834';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x, 10);
          ctx.quadraticCurveTo(x + (i % 3 - 1) * 8, -h * 0.45, x + (i % 2 ? 8 : -8), -h);
          ctx.stroke();
        }
      } else if (item.type === 'rock') {
        ctx.fillStyle = 'rgba(0,0,0,.27)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 42, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#636c62';
        ctx.beginPath();
        ctx.moveTo(-38, 10);
        ctx.lineTo(-18, -30);
        ctx.lineTo(22, -38);
        ctx.lineTo(44, 2);
        ctx.lineTo(18, 22);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.16)';
        ctx.stroke();
      } else if (item.type === 'wall') {
        ctx.fillStyle = 'rgba(0,0,0,.24)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 76, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 4; i += 1) {
          ctx.fillStyle = i % 2 ? '#716a57' : '#5d584a';
          ctx.fillRect(-70 + i * 36, -18 - (i % 2) * 10, 34, 32 + (i % 2) * 10);
          ctx.strokeStyle = 'rgba(255,229,153,.18)';
          ctx.strokeRect(-70 + i * 36, -18 - (i % 2) * 10, 34, 32 + (i % 2) * 10);
        }
      } else if (item.type === 'torch') {
        const style = TEAM_STYLE[item.team || BLUE];
        ctx.fillStyle = 'rgba(0,0,0,.26)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5d5142';
        ctx.fillRect(-7, -44, 14, 56);
        ctx.shadowColor = style.main;
        ctx.shadowBlur = 22;
        ctx.fillStyle = style.main;
        ctx.beginPath();
        ctx.moveTo(0, -72);
        ctx.lineTo(14, -48);
        ctx.lineTo(0, -36);
        ctx.lineTo(-14, -48);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(0,0,0,.24)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 52, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5f5848';
        ctx.fillRect(-42, -8, 84, 20);
        ctx.fillStyle = '#756c56';
        ctx.fillRect(-28, -42, 18, 38);
        ctx.fillRect(14, -34, 18, 30);
        ctx.strokeStyle = 'rgba(255, 229, 153, .28)';
        ctx.strokeRect(-42, -8, 84, 20);
      }
      ctx.restore();
    }

    drawBuilding(ctx, building) {
      const style = TEAM_STYLE[building.team];
      const dead = building.dead;
      ctx.save();
      ctx.translate(building.x, building.y);
      ctx.globalAlpha = dead ? 0.46 : 1;

      if (!dead) {
        ctx.save();
        ctx.globalAlpha = building.type === 'tower' ? 0.055 : 0.045;
        ctx.fillStyle = style.main;
        ctx.beginPath();
        ctx.ellipse(0, 18, building.attackRange, building.attackRange * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = building.type === 'tower' ? 0.18 : 0.14;
        ctx.setLineDash([14, 18]);
        ctx.strokeStyle = style.main;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 18, building.attackRange, building.attackRange * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = 'rgba(0,0,0,.46)';
      ctx.beginPath();
      ctx.ellipse(0, 24, building.radius * 1.52, building.radius * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();

      const buildingCells = BUILDING_CELLS[building.team];
      const buildingCell = buildingCells && buildingCells[building.type];
      if (this.assets.buildings && buildingCell !== undefined) {
        const box = building.type === 'tower'
          ? { x: -84, y: -178, w: 168, h: 202 }
          : { x: -86, y: -134, w: 172, h: 158 };
        this.drawBuildingSheetCell(ctx, this.assets.buildings, buildingCell, box.x, box.y, box.w, box.h);
        ctx.restore();
        if (!building.dead) this.drawNameplate(ctx, building, building.name, building.type === 'tower' ? -166 : -126, building.type === 'tower' ? 106 : 118);
        return;
      }

      if (building.type === 'tower') {
        [
          { y: 28, w: 74, h: 34, color: '#3f392e' },
          { y: 12, w: 60, h: 28, color: '#6f654f' },
          { y: -4, w: 46, h: 23, color: '#847a60' },
        ].forEach(layer => {
          ctx.fillStyle = layer.color;
          ctx.beginPath();
          ctx.moveTo(-layer.w, layer.y);
          ctx.lineTo(0, layer.y - layer.h);
          ctx.lineTo(layer.w, layer.y);
          ctx.lineTo(0, layer.y + layer.h);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,232,170,.22)';
          ctx.stroke();
        });
        ctx.fillStyle = '#51493a';
        [-1, 1].forEach(side => {
          ctx.beginPath();
          ctx.moveTo(side * 22, 4);
          ctx.lineTo(side * 43, -18);
          ctx.lineTo(side * 34, -92);
          ctx.lineTo(side * 13, -82);
          ctx.closePath();
          ctx.fill();
        });
        const column = ctx.createLinearGradient(-26, -106, 28, 8);
        column.addColorStop(0, '#8f856b');
        column.addColorStop(0.52, '#5d5545');
        column.addColorStop(1, '#39352f');
        ctx.fillStyle = column;
        ctx.beginPath();
        ctx.moveTo(-30, 8);
        ctx.lineTo(-20, -108);
        ctx.lineTo(20, -108);
        ctx.lineTo(30, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,232,170,.24)';
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let i = 0; i < 4; i += 1) {
          ctx.strokeStyle = i % 2 ? 'rgba(0,0,0,.24)' : style.main;
          ctx.globalAlpha = dead ? 0.24 : i % 2 ? 0.34 : 0.48;
          ctx.lineWidth = i % 2 ? 5 : 2;
          ctx.beginPath();
          ctx.moveTo(-22 + i * 4, -16 - i * 20);
          ctx.lineTo(22 - i * 4, -16 - i * 20);
          ctx.stroke();
        }
        ctx.globalAlpha = dead ? 0.46 : 1;
        ctx.fillStyle = '#81765d';
        ctx.beginPath();
        ctx.moveTo(-44, -78);
        ctx.lineTo(0, -100);
        ctx.lineTo(44, -78);
        ctx.lineTo(0, -52);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,232,170,.28)';
        ctx.stroke();
        ctx.shadowColor = style.main;
        ctx.shadowBlur = dead ? 0 : 14;
        ctx.fillStyle = dead ? '#656565' : style.main;
        ctx.beginPath();
        ctx.moveTo(0, -156);
        ctx.lineTo(30, -112);
        ctx.lineTo(10, -68);
        ctx.lineTo(-10, -68);
        ctx.lineTo(-30, -112);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.38)';
        ctx.beginPath();
        ctx.moveTo(-7, -132);
        ctx.lineTo(8, -108);
        ctx.lineTo(0, -84);
        ctx.lineTo(-16, -110);
        ctx.closePath();
        ctx.fill();
      } else {
        [
          { y: 34, w: 92, h: 42, color: '#433b30' },
          { y: 12, w: 72, h: 33, color: '#695f4a' },
          { y: -8, w: 54, h: 25, color: '#857a5f' },
        ].forEach(layer => {
          ctx.fillStyle = layer.color;
          ctx.beginPath();
          ctx.moveTo(-layer.w, layer.y);
          ctx.lineTo(0, layer.y - layer.h);
          ctx.lineTo(layer.w, layer.y);
          ctx.lineTo(0, layer.y + layer.h);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,232,170,.22)';
          ctx.stroke();
        });
        ctx.strokeStyle = style.main;
        ctx.lineWidth = 4;
        ctx.shadowColor = style.main;
        ctx.shadowBlur = dead ? 0 : 18;
        [-18, 0, 18].forEach((dy, index) => {
          ctx.globalAlpha = dead ? 0.25 : 0.46 - index * 0.08;
          ctx.beginPath();
          ctx.ellipse(0, dy + 10, 70 - index * 10, 27 - index * 3, 0, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.globalAlpha = dead ? 0.46 : 1;
        ctx.fillStyle = dead ? '#686868' : style.main;
        ctx.beginPath();
        ctx.moveTo(0, -116);
        ctx.lineTo(46, -34);
        ctx.lineTo(20, 32);
        ctx.lineTo(0, 46);
        ctx.lineTo(-20, 32);
        ctx.lineTo(-46, -34);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.52)';
        ctx.beginPath();
        ctx.moveTo(-9, -76);
        ctx.lineTo(12, -28);
        ctx.lineTo(0, 14);
        ctx.lineTo(-22, -32);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,.18)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 34, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (!building.dead) this.drawNameplate(ctx, building, building.name, building.type === 'tower' ? -166 : -126, building.type === 'tower' ? 106 : 118);
    }

    drawMinion(ctx, minion) {
      const style = TEAM_STYLE[minion.team];
      const perspective = 0.8 + clamp(minion.y / HUD_Y, 0, 1) * 0.14;
      const scale = (minion.type === 'siege' ? 0.98 : minion.type === 'ranged' ? 0.78 : 0.84) * perspective;
      const v = rowVector(minion.direction);
      ctx.save();
      ctx.globalAlpha = minion.dead ? 0.42 : 1;
      ctx.translate(minion.x, minion.y);
      ctx.scale(scale, scale);
      ctx.fillStyle = 'rgba(0,0,0,.52)';
      ctx.beginPath();
      ctx.ellipse(0, 12, minion.type === 'siege' ? 25 : 19, minion.type === 'siege' ? 9 : 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = style.main;
      ctx.globalAlpha = minion.dead ? 0.34 : 0.72;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 11, minion.type === 'siege' ? 25 : 18, minion.type === 'siege' ? 9 : 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = minion.dead ? 0.42 : 1;
      const attacking = !minion.dead && minion.target && distance(minion, minion.target) <= minion.attackRange + minion.target.radius + 4;
      const action = attacking ? 'attack' : 'move';
      const frame = Math.floor((this.time * (attacking ? 10 : 7.5)) + minion.id) % ANIM_COLUMNS;
      const box = minion.type === 'siege'
        ? { y: -74, w: 94, h: 84 }
        : { y: -64, w: 74, h: 74 };
      const directionKey = minionDirectionKey(minion.direction);
      const directionRow = directionKey ? MINION_DIRECTION_ROWS[directionKey]?.[minion.team]?.[minion.type]?.[action] : undefined;
      if (this.assets.minionDirections && directionRow !== undefined) {
        this.drawAnimCell(ctx, this.assets.minionDirections, directionRow, frame, -box.w / 2, box.y, box.w, box.h);
        ctx.restore();
        if (!minion.dead) this.drawSmallHealth(ctx, minion, minion.type === 'siege' ? 48 : 42);
        return;
      }
      const minionRows = MINION_ROWS[minion.team] && MINION_ROWS[minion.team][minion.type];
      const minionRow = minionRows && minionRows[action];
      if (this.assets.minions && minionRow !== undefined) {
        if (v.x < -0.15) ctx.scale(-1, 1);
        this.drawAnimCell(ctx, this.assets.minions, minionRow, frame, -box.w / 2, box.y, box.w, box.h);
        ctx.restore();
        if (!minion.dead) this.drawSmallHealth(ctx, minion, minion.type === 'siege' ? 48 : 42);
        return;
      }
      const minionCells = OBJECT_CELLS.minion[minion.team];
      const minionCell = minionCells && minionCells[minion.type];
      if (this.assets.objects && minionCell !== undefined) {
        const box = minion.type === 'siege'
          ? { y: -74, w: 94, h: 84 }
          : { y: -64, w: 74, h: 74 };
        if (v.x < -0.15) ctx.scale(-1, 1);
        this.drawSheetCell(ctx, this.assets.objects, minionCell, -box.w / 2, box.y, box.w, box.h);
        ctx.restore();
        if (!minion.dead) this.drawSmallHealth(ctx, minion, minion.type === 'siege' ? 48 : 42);
        return;
      }
      if (minion.type === 'siege') {
        const body = ctx.createLinearGradient(-22, -30, 22, 12);
        body.addColorStop(0, '#827150');
        body.addColorStop(1, '#4f412f');
        roundedRect(ctx, -23, -28, 46, 38, 9);
        ctx.fillStyle = body;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,229,153,.24)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = style.dark;
        roundedRect(ctx, -14, -20, 28, 18, 6);
        ctx.fill();
        ctx.fillStyle = style.main;
        ctx.shadowColor = style.main;
        ctx.shadowBlur = 13;
        ctx.beginPath();
        ctx.arc(v.x * 8, -36 + v.y * 3, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#2a2118';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-18, 8);
        ctx.lineTo(-5, 15);
        ctx.moveTo(18, 8);
        ctx.lineTo(5, 15);
        ctx.stroke();
      } else {
        const armor = ctx.createLinearGradient(-14, -28, 14, 10);
        armor.addColorStop(0, minion.team === BLUE ? '#176b70' : '#6b1d3e');
        armor.addColorStop(1, style.dark);
        ctx.fillStyle = armor;
        ctx.beginPath();
        ctx.ellipse(0, -8, 15, 21, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#2f3335';
        ctx.beginPath();
        ctx.ellipse(0, -25, 13, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = style.main;
        ctx.shadowColor = style.main;
        ctx.shadowBlur = 11;
        ctx.beginPath();
        ctx.arc(v.x * 4, -25 + v.y * 2, 6.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = minion.type === 'ranged' ? style.main : '#efe0aa';
        ctx.lineWidth = minion.type === 'ranged' ? 3.2 : 4.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-v.x * 7, -8 - v.y * 2);
        ctx.lineTo(v.x * (minion.type === 'ranged' ? 35 : 27), -7 + v.y * 17);
        ctx.stroke();
        if (minion.type === 'ranged') {
          ctx.fillStyle = style.main;
          ctx.beginPath();
          ctx.arc(v.x * 35, -7 + v.y * 17, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      if (!minion.dead) this.drawSmallHealth(ctx, minion, minion.type === 'siege' ? 48 : 42);
    }

    drawHero(ctx, hero) {
      const style = TEAM_STYLE[hero.team];
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.beginPath();
      ctx.ellipse(hero.x, hero.y + 8, 27, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      if (hero.shield > 0 && !hero.dead) {
        ctx.strokeStyle = '#8fffe9';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#8fffe9';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(hero.x, hero.y - 18, 42, 54, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (hero.recallTimer > 0) {
        ctx.strokeStyle = '#8fffe9';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(hero.x, hero.y + 4, 62, 24, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - hero.recallTimer / 4.2));
        ctx.stroke();
      }
      const action = this.currentHeroAction(hero);
      const enemyImg = hero.team === RED ? this.assets[`enemy-${action}`] : null;
      const img = enemyImg || this.assets[action] || this.assets.idle;
      const frame = hero.dead ? Math.min(5, Math.floor(hero.deathAnim * 7)) : Math.floor(hero.animTime * 8.5) % 6;
      const row = hero.direction;
      const perspective = 0.8 + clamp(hero.y / HUD_Y, 0, 1) * 0.12;
      const size = (hero.isPlayer ? 86 : 82) * perspective;
      if (hero.isPlayer && !hero.dead) {
        ctx.strokeStyle = 'rgba(255,229,153,.7)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffe599';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(hero.x, hero.y + 8, 34, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (img) {
        ctx.save();
        ctx.shadowColor = style.main;
        ctx.shadowBlur = hero.isPlayer ? 18 : 14;
        if (enemyImg) ctx.filter = 'saturate(1.2) brightness(1.1) contrast(1.1)';
        else if (hero.team === RED) ctx.filter = 'hue-rotate(132deg) saturate(1.5) brightness(1.08) contrast(1.14)';
        else ctx.filter = 'saturate(1.26) brightness(1.16) contrast(1.12)';
        ctx.drawImage(img, frame * 64, row * 64, 64, 64, hero.x - size / 2, hero.y - size + 24, size, size);
        ctx.restore();
      } else {
        ctx.fillStyle = style.main;
        ctx.beginPath();
        ctx.arc(hero.x, hero.y - 28, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = style.main;
      ctx.lineWidth = hero.isPlayer ? 3 : 2;
      ctx.shadowColor = style.main;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.ellipse(hero.x, hero.y + 7, 29, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (!hero.dead) this.drawNameplate(ctx, hero, `${hero.name} Lv.${hero.level}`, -82, 86);
      else drawText(ctx, `复活 ${Math.max(0, hero.respawnTimer).toFixed(0)}s`, hero.x, hero.y - 84, 14, '#ffb0bd', 'center', '900');
    }

    currentHeroAction(hero) {
      if (hero.dead) return 'death';
      if (hero.hitTimer > 0) return 'hit';
      if (hero.actionLock > 0 && hero.action === 'attack') return 'attack';
      if (hero.moving) return 'move';
      return 'idle';
    }

    drawNameplate(ctx, entity, label, yOffset, width) {
      const style = TEAM_STYLE[entity.team];
      const isHero = entity.kind === 'hero';
      const x = entity.x - width / 2;
      const y = entity.y + yOffset;
      ctx.save();
      roundedRect(ctx, x - (isHero ? 18 : 6), y - 25, width + (isHero ? 30 : 12), isHero ? 44 : 32, 7);
      ctx.fillStyle = 'rgba(1, 7, 9, .82)';
      ctx.fill();
      ctx.strokeStyle = `${style.main}aa`;
      ctx.lineWidth = isHero ? 1.7 : 1.3;
      ctx.stroke();
      if (isHero) {
        ctx.fillStyle = 'rgba(0,0,0,.82)';
        ctx.beginPath();
        ctx.arc(x - 5, y - 6, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = style.main;
        ctx.stroke();
        drawText(ctx, entity.level, x - 5, y - 6, 12, '#ffe599', 'center', '900');
      }
      ctx.restore();
      drawText(ctx, label, entity.x + (isHero ? 7 : 0), y - 12, isHero ? 12 : 12, style.text, 'center', '900');
      drawBar(ctx, x, y, width, isHero ? 9 : 8, hpRatio(entity), style.bar, 'rgba(0,0,0,.72)', 'rgba(255,255,255,.34)');
      if (isHero) {
        for (let i = 1; i < 6; i += 1) {
          ctx.strokeStyle = 'rgba(0,0,0,.42)';
          ctx.beginPath();
          ctx.moveTo(x + i * width / 6, y + 1);
          ctx.lineTo(x + i * width / 6, y + 8);
          ctx.stroke();
        }
        drawBar(ctx, x, y + 12, width, 6, manaRatio(entity), style.mana, 'rgba(0,0,0,.56)', 'rgba(255,255,255,.24)');
      }
    }

    drawSmallHealth(ctx, entity, width) {
      const style = TEAM_STYLE[entity.team];
      drawBar(ctx, entity.x - width / 2, entity.y - 44, width, 6, hpRatio(entity), style.bar, 'rgba(0,0,0,.72)', `${style.main}66`);
    }

    drawCursorIntent(ctx) {
      if (this.player.moveTarget && !this.player.dead) {
        ctx.save();
        ctx.strokeStyle = this.player.attackMove ? '#ffe599' : '#8fffe9';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(this.player.x, this.player.y);
        ctx.lineTo(this.player.moveTarget.x, this.player.moveTarget.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawHUD(ctx) {
      this.drawTopHUD(ctx);
      this.drawMessages(ctx);
      this.drawBottomHUD(ctx);
      this.drawTeamRoster(ctx);
      this.drawMiniMap(ctx);
    }

    drawTopHUD(ctx) {
      ctx.save();
      const panel = ctx.createLinearGradient(0, 0, 0, 64);
      panel.addColorStop(0, 'rgba(0, 5, 7, .76)');
      panel.addColorStop(0.62, 'rgba(0, 5, 7, .3)');
      panel.addColorStop(1, 'rgba(0, 5, 7, 0)');
      ctx.fillStyle = panel;
      ctx.fillRect(0, 0, WIDTH, 66);
      ctx.strokeStyle = 'rgba(190,170,105,.12)';
      ctx.beginPath();
      ctx.moveTo(0, 54.5);
      ctx.lineTo(WIDTH, 54.5);
      ctx.stroke();

      roundedRect(ctx, 498, 6, 284, 44, 3);
      ctx.fillStyle = 'rgba(0,0,0,.68)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(190,170,105,.28)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(44,107,145,.22)';
      ctx.fillRect(502, 10, 74, 36);
      ctx.fillStyle = 'rgba(130,39,52,.22)';
      ctx.fillRect(704, 10, 74, 36);
      ctx.strokeStyle = 'rgba(216,190,112,.44)';
      ctx.beginPath();
      ctx.moveTo(640, 8);
      ctx.lineTo(666, 28);
      ctx.lineTo(640, 48);
      ctx.lineTo(614, 28);
      ctx.closePath();
      ctx.stroke();
      drawText(ctx, this.score.blueKills, 539, 31, 22, '#6fb9ff', 'center', '900');
      drawText(ctx, this.formatTime(this.time), 640, 30, 20, '#d9c681', 'center', '900');
      drawText(ctx, this.score.redKills, 741, 31, 22, '#d96161', 'center', '900');
      drawText(ctx, this.getPhaseText(), WIDTH / 2, 62, 11, 'rgba(230,225,190,.72)', 'center', '700');

      this.drawTopHeroPanel(ctx, this.player, 14, 10, TEAM_STYLE.blue);
      this.drawTopHeroPanel(ctx, this.enemy, WIDTH - 264, 10, TEAM_STYLE.red, true);
      ctx.restore();
    }

    drawTopHeroPanel(ctx, hero, x, y, style, reverse = false) {
      const w = 250;
      roundedRect(ctx, x, y, w, 42, 3);
      ctx.fillStyle = 'rgba(1, 7, 9, .66)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(190,170,105,.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
      const avatarX = reverse ? x + w - 22 : x + 22;
      ctx.fillStyle = 'rgba(0,0,0,.66)';
      ctx.beginPath();
      ctx.arc(avatarX, y + 21, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = style.main;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      drawText(ctx, hero.level, avatarX, y + 21, 12, '#d9c681', 'center', '900');
      const tx = reverse ? x + w - 44 : x + 44;
      const align = reverse ? 'right' : 'left';
      drawText(ctx, hero.name, tx, y + 13, 11, style.text, align, '900');
      const barX = reverse ? x + w - 168 : x + 44;
      drawBar(ctx, barX, y + 20, 124, 7, hpRatio(hero), style.bar, 'rgba(0,0,0,.68)');
      drawBar(ctx, barX, y + 30, 124, 4, manaRatio(hero), style.mana, 'rgba(0,0,0,.58)');
      const statText = `K ${reverse ? this.score.redKills : this.score.blueKills}  CS ${hero.cs || 0}  G ${Math.floor(hero.gold || 0)}`;
      drawText(ctx, statText, reverse ? x + 10 : x + w - 10, y + 13, 9, '#d9c681', reverse ? 'left' : 'right', '700');
    }

    drawTeamRoster(ctx) {
      const map = this.miniMapRect();
      const x = map.x + 8;
      const y = map.y - 42;
      ctx.save();
      roundedRect(ctx, x - 6, y - 6, 206, 38, 4);
      ctx.fillStyle = 'rgba(1, 6, 8, .78)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(190,170,105,.24)';
      ctx.stroke();
      const slots = [
        { team: BLUE, hp: hpRatio(this.player), label: '1' },
        { team: BLUE, hp: 0.84, label: '2' },
        { team: RED, hp: hpRatio(this.enemy), label: 'E' },
        { team: RED, hp: 0.78, label: 'T' },
      ];
      slots.forEach((slot, index) => {
        const style = TEAM_STYLE[slot.team];
        const px = x + 17 + index * 48;
        ctx.fillStyle = 'rgba(0,0,0,.68)';
        ctx.beginPath();
        ctx.arc(px, y + 13, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = style.main;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        drawText(ctx, slot.label, px, y + 13, 10, '#ffffff', 'center', '900');
        drawBar(ctx, px - 15, y + 28, 30, 3, slot.hp, style.bar, 'rgba(0,0,0,.76)', 'rgba(255,255,255,.18)');
      });
      ctx.restore();
    }

    getPhaseText() {
      if (this.getBuilding(RED, 'tower').dead && this.getBuilding(BLUE, 'tower').dead) return '双塔已破：基地决战';
      if (this.getBuilding(RED, 'tower').dead) return '推进期：攻击敌方核心';
      if (this.getBuilding(BLUE, 'tower').dead) return '防守期：己方基地告急';
      return '对线期：补刀、升级、消耗、推塔';
    }

    drawBottomHUD(ctx) {
      const hero = this.player;
      ctx.save();
      const grad = ctx.createLinearGradient(0, HUD_Y - 12, 0, HEIGHT);
      grad.addColorStop(0, 'rgba(0, 0, 0, .08)');
      grad.addColorStop(0.12, 'rgba(1, 4, 6, .94)');
      grad.addColorStop(1, 'rgba(0, 1, 3, .99)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, HUD_Y - 12, WIDTH, HEIGHT - HUD_Y + 12);
      ctx.strokeStyle = 'rgba(190,170,105,.2)';
      ctx.beginPath();
      ctx.moveTo(0, HUD_Y + 0.5);
      ctx.lineTo(WIDTH, HUD_Y + 0.5);
      ctx.stroke();
      roundedRect(ctx, 88, 600, 884, 108, 3);
      ctx.fillStyle = 'rgba(0, 3, 5, .9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(161, 135, 72, .42)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      const hudShine = ctx.createLinearGradient(88, 600, 972, 708);
      hudShine.addColorStop(0, 'rgba(54, 215, 232, .055)');
      hudShine.addColorStop(0.48, 'rgba(255,255,255,.012)');
      hudShine.addColorStop(1, 'rgba(255, 56, 95, .05)');
      ctx.fillStyle = hudShine;
      ctx.fill();

      roundedRect(ctx, 96, 606, 300, 94, 5);
      ctx.fillStyle = 'rgba(2, 7, 8, .72)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(185, 163, 105, .32)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(22, 28, 21, .95)';
      ctx.beginPath();
      ctx.arc(146, 653, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(198, 171, 98, .78)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(45, 77, 54, .9)';
      ctx.beginPath();
      ctx.arc(146, 653, 31, 0, Math.PI * 2);
      ctx.fill();
      if (this.assets.idle) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(146, 653, 31, 0, Math.PI * 2);
        ctx.clip();
        ctx.filter = 'saturate(1.12) brightness(1.08) contrast(1.08)';
        ctx.drawImage(this.assets.idle, 0, 0, 64, 64, 112, 614, 68, 76);
        ctx.restore();
      }
      ctx.strokeStyle = TEAM_STYLE.blue.main;
      ctx.beginPath();
      ctx.arc(146, 653, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpRatio(hero));
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.72)';
      ctx.beginPath();
      ctx.arc(118, 681, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(198, 171, 98, .72)';
      ctx.stroke();
      drawText(ctx, hero.level, 118, 681, 13, '#ffe599', 'center', '900');
      drawText(ctx, '秘源守卫', 204, 620, 15, '#f0efe2', 'left', '900');
      drawText(ctx, `CS ${hero.cs}   ${Math.floor(hero.gold)}g   波次 ${this.waveNumber}`, 204, 690, 12, '#e3c36f', 'left', '900');

      drawBar(ctx, 204, 636, 170, 16, hpRatio(hero), TEAM_STYLE.blue.bar, 'rgba(0,0,0,.7)', 'rgba(221,202,132,.34)');
      drawText(ctx, `${Math.ceil(hero.hp)} / ${hero.maxHp}`, 289, 644, 11, '#071510', 'center', '900');
      drawBar(ctx, 204, 659, 170, 11, manaRatio(hero), TEAM_STYLE.blue.mana, 'rgba(0,0,0,.62)', 'rgba(221,202,132,.22)');
      drawBar(ctx, 204, 676, 112, 7, hero.xp / hero.xpNeeded, '#d6b95e', 'rgba(0,0,0,.6)', 'rgba(221,202,132,.2)');
      [['AD', Math.round(hero.attackDamage)], ['AP', Math.round(hero.spellPower)], ['MS', Math.round(hero.speed)], ['CS', hero.cs]].forEach(([label, value], index) => {
        const sx = 104 + (index % 2) * 38;
        const sy = 612 + Math.floor(index / 2) * 16;
        drawText(ctx, label, sx, sy, 8, 'rgba(218,219,190,.72)', 'left', '900');
        drawText(ctx, value, sx + 26, sy, 9, '#e3c36f', 'right', '900');
      });

      roundedRect(ctx, 404, 606, 554, 94, 3);
      ctx.fillStyle = 'rgba(0, 2, 4, .84)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(185, 163, 105, .18)';
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.025)';
      for (let i = 0; i < 8; i += 1) ctx.fillRect(416 + i * 64, 614, 1, 72);
      this.drawSkillBar(ctx, hero);
      this.drawSummonerSlots(ctx);
      this.drawInventory(ctx, hero);
      ctx.restore();
    }

    drawSkillBar(ctx, hero) {
      const keys = ['q', 'w', 'e', 'r'];
      const startX = 432;
      keys.forEach((key, index) => {
        const skill = hero.skills[key];
        const x = startX + index * 64;
        const y = 626;
        roundedRect(ctx, x, y, 54, 54, 4);
        ctx.fillStyle = skill.level > 0 ? 'rgba(9, 27, 31, .94)' : 'rgba(13, 14, 18, .9)';
        ctx.fill();
        ctx.strokeStyle = skill.cooldown > 0 ? '#444' : key === 'r' ? '#cda65a' : '#56c8dc';
        ctx.lineWidth = 1.7;
        ctx.stroke();
        this.drawSkillIcon(ctx, key, x + 27, y + 26, skill.level > 0);
        if (skill.cooldown > 0) {
          const ratio = skill.cooldown / skill.lastCooldown;
          ctx.fillStyle = 'rgba(0,0,0,.72)';
          ctx.fillRect(x, y, 54, 54 * ratio);
          drawText(ctx, skill.cooldown.toFixed(1), x + 27, y + 27, 15, '#ffffff', 'center', '900');
        }
        drawText(ctx, skill.key, x + 7, y + 8, 11, '#ffffff', 'center', '900');
        drawText(ctx, `Lv.${skill.level}`, x + 27, y + 66, 11, '#bfece2', 'center', '700');
        if (hero.skillPoints > 0 && skill.level < skill.max && (key !== 'r' || hero.level >= 6)) {
          drawText(ctx, '+', x + 48, y + 8, 15, '#ffe599', 'center', '900');
        }
      });
    }

    drawSkillIcon(ctx, key, x, y, active) {
      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.32;
      const iconCell = ICON_CELLS.skills[key];
      if (this.assets.icons && iconCell !== undefined) {
        this.drawSheetCell(ctx, this.assets.icons, iconCell, x - 24, y - 24, 48, 48);
        ctx.restore();
        return;
      }
      ctx.strokeStyle = key === 'r' ? '#e3c36f' : '#8fb4c4';
      ctx.fillStyle = key === 'w' ? 'rgba(143,180,196,.18)' : 'transparent';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = 'rgba(0,0,0,.7)';
      ctx.shadowBlur = 4;
      if (key === 'q') {
        ctx.beginPath();
        ctx.arc(x, y, 18, -0.8, 0.8);
        ctx.stroke();
      } else if (key === 'w') {
        ctx.beginPath();
        ctx.moveTo(x, y - 20);
        ctx.lineTo(x + 17, y - 7);
        ctx.lineTo(x + 11, y + 18);
        ctx.lineTo(x, y + 24);
        ctx.lineTo(x - 11, y + 18);
        ctx.lineTo(x - 17, y - 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (key === 'e') {
        ctx.beginPath();
        ctx.moveTo(x - 18, y + 16);
        ctx.lineTo(x + 18, y - 16);
        ctx.moveTo(x + 3, y - 19);
        ctx.lineTo(x + 20, y - 18);
        ctx.lineTo(x + 19, y - 1);
        ctx.stroke();
      } else {
        ctx.beginPath();
        for (let i = 0; i < 8; i += 1) {
          const a = -Math.PI / 2 + i * Math.PI / 4;
          const r = i % 2 ? 9 : 23;
          const px = x + Math.cos(a) * r;
          const py = y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    drawSummonerSlots(ctx) {
      [['D', '#8fb4c4'], ['F', '#e3c36f']].forEach(([key, color], index) => {
        const x = 696;
        const y = 628 + index * 33;
        roundedRect(ctx, x, y, 30, 30, 6);
        ctx.fillStyle = 'rgba(12, 24, 27, .86)';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        const iconCell = ICON_CELLS.summoners[index];
        if (this.assets.icons && iconCell !== undefined) {
          this.drawSheetCell(ctx, this.assets.icons, iconCell, x + 4, y + 4, 22, 22);
          drawText(ctx, key, x + 6, y + 7, 9, '#ffffff', 'center', '900');
          return;
        }
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.moveTo(x + 9, y + 21);
        ctx.lineTo(x + 15, y + 8);
        ctx.lineTo(x + 21, y + 21);
        ctx.stroke();
        ctx.shadowBlur = 0;
        drawText(ctx, key, x + 6, y + 7, 9, '#ffffff', 'center', '900');
      });
    }

    drawInventory(ctx, hero) {
      const startX = 760;
      ITEMS.forEach((item, index) => {
        const x = startX + index * 48;
        const y = 646;
        roundedRect(ctx, x, y, 42, 42, 3);
        ctx.fillStyle = hero.inventory[index] ? 'rgba(221, 174, 70, .28)' : 'rgba(255,255,255,.055)';
        ctx.fill();
        ctx.strokeStyle = hero.inventory[index] ? '#dcae46' : 'rgba(185,163,105,.24)';
        ctx.stroke();
        const iconCell = ICON_CELLS.items[index];
        if (this.assets.icons && iconCell !== undefined) {
          ctx.save();
          ctx.globalAlpha = hero.inventory[index] ? 1 : 0.56;
          this.drawSheetCell(ctx, this.assets.icons, iconCell, x + 5, y + 4, 32, 32);
          ctx.restore();
        } else {
          ctx.fillStyle = hero.inventory[index] ? '#dcae46' : 'rgba(160,170,150,.58)';
          ctx.beginPath();
          ctx.moveTo(x + 21, y + 8);
          ctx.lineTo(x + 32, y + 19);
          ctx.lineTo(x + 21, y + 34);
          ctx.lineTo(x + 10, y + 19);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,.38)';
          ctx.fillRect(x + 14, y + 18, 16, 5);
        }
        drawText(ctx, item.key, x + 7, y + 8, 10, '#ffffff', 'center', '900');
        drawText(ctx, hero.inventory[index] ? '已购' : item.cost, x + 21, y + 37, 9, hero.inventory[index] ? '#cda65a' : '#c8c4a8', 'center', '700');
      });
      drawText(ctx, '装备栏', startX + 100, 626, 12, '#d8d3b6', 'center', '900');
    }

    drawMessages(ctx) {
      const x = 22;
      const y = 454;
      roundedRect(ctx, x, y, 356, 112, 4);
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(190,170,105,.08)';
      ctx.stroke();
      this.messages.slice(-5).forEach((message, index) => {
        ctx.save();
        ctx.globalAlpha = clamp(message.life / 1.4, 0.42, 0.88);
        drawText(ctx, message.text, x + 14, y + 22 + index * 18, 11, message.color, 'left', '700');
        ctx.restore();
      });
    }

    drawMiniMap(ctx) {
      const map = this.miniMapRect();
      roundedRect(ctx, map.x - 8, map.y - 8, map.w + 16, map.h + 16, 3);
      ctx.fillStyle = 'rgba(0, 2, 4, .96)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(139,115,61,.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.save();
      roundedRect(ctx, map.x, map.y, map.w, map.h, 3);
      ctx.clip();
      const bg = ctx.createLinearGradient(map.x, map.y, map.x + map.w, map.y + map.h);
      bg.addColorStop(0, '#071a12');
      bg.addColorStop(0.48, '#102014');
      bg.addColorStop(1, '#090e13');
      ctx.fillStyle = bg;
      ctx.fillRect(map.x, map.y, map.w, map.h);
      ctx.fillStyle = 'rgba(5, 13, 16, .52)';
      [[.08, .06, .36, .28], [.64, .68, .42, .3], [.03, .72, .28, .22], [.72, .02, .26, .2]].forEach(blob => {
        ctx.beginPath();
        ctx.ellipse(map.x + map.w * blob[0], map.y + map.h * blob[1], map.w * blob[2], map.h * blob[3], -0.45, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(23, 49, 31, .62)';
      ctx.beginPath();
      ctx.moveTo(map.x, map.y + map.h * .08);
      ctx.lineTo(map.x + map.w * .45, map.y);
      ctx.lineTo(map.x + map.w, map.y);
      ctx.lineTo(map.x + map.w, map.y + map.h * .26);
      ctx.lineTo(map.x + map.w * .68, map.y + map.h * .43);
      ctx.lineTo(map.x + map.w * .22, map.y + map.h * .78);
      ctx.lineTo(map.x, map.y + map.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.06)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i += 1) {
        ctx.beginPath();
        ctx.moveTo(map.x + i * map.w / 6, map.y);
        ctx.lineTo(map.x + i * map.w / 6, map.y + map.h);
        ctx.moveTo(map.x, map.y + i * map.h / 6);
        ctx.lineTo(map.x + map.w, map.y + i * map.h / 6);
        ctx.stroke();
      }
      [[0.09, 0.84, TEAM_STYLE.blue.main], [0.91, 0.16, TEAM_STYLE.red.main]].forEach(([px, py, color]) => {
        ctx.fillStyle = `${color}22`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(map.x + map.w * px, map.y + map.h * py, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(31, 64, 40, .72)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      [[0.12, 0.88, 0.35, 0.66], [0.65, 0.34, 0.88, 0.12], [0.06, 0.48, 0.33, 0.56], [0.67, 0.42, 0.94, 0.53]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(map.x + map.w * x1, map.y + map.h * y1);
        ctx.lineTo(map.x + map.w * x2, map.y + map.h * y2);
        ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(4, 9, 10, .7)';
      ctx.lineWidth = 11;
      [[0.02, 0.95, 0.2, 0.78], [0.8, 0.22, 0.98, 0.04]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(map.x + map.w * x1, map.y + map.h * y1);
        ctx.lineTo(map.x + map.w * x2, map.y + map.h * y2);
        ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(21, 11, 14, .82)';
      ctx.lineWidth = 11;
      ctx.beginPath();
      LANE_PATH.forEach((p, index) => {
        const m = this.worldToMini(p);
        if (index === 0) ctx.moveTo(m.x, m.y);
        else ctx.lineTo(m.x, m.y);
      });
      ctx.stroke();
      ctx.strokeStyle = 'rgba(185, 42, 58, .92)';
      ctx.lineWidth = 4;
      ctx.stroke();

      this.buildings.forEach(entity => {
        const p = this.worldToMini(entity);
        const style = TEAM_STYLE[entity.team];
        ctx.save();
        ctx.globalAlpha = entity.dead ? 0.32 : 1;
        ctx.fillStyle = style.main;
        ctx.strokeStyle = '#081012';
        ctx.lineWidth = 2;
        if (entity.type === 'core') {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 8);
          ctx.lineTo(p.x + 8, p.y);
          ctx.lineTo(p.x, p.y + 8);
          ctx.lineTo(p.x - 8, p.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
          ctx.strokeRect(p.x - 6, p.y - 6, 12, 12);
        }
        ctx.restore();
      });

      this.minions.forEach(entity => {
        if (entity.dead) return;
        const p = this.worldToMini(entity);
        ctx.fillStyle = TEAM_STYLE[entity.team].main;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, entity.type === 'siege' ? 3.1 : 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      this.heroes.forEach(entity => {
        if (entity.dead) return;
        const p = this.worldToMini(entity);
        ctx.globalAlpha = 1;
        ctx.fillStyle = TEAM_STYLE[entity.team].main;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      const playerMini = this.worldToMini(this.player);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,.78)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(clamp(playerMini.x - 32, map.x + 4, map.x + map.w - 68), clamp(playerMini.y - 22, map.y + 4, map.y + map.h - 48), 64, 42);
      ctx.setLineDash([]);
      ctx.restore();
      ctx.globalAlpha = 1;
      roundedRect(ctx, map.x, map.y, map.w, map.h, 3);
      ctx.strokeStyle = 'rgba(190,170,105,.5)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    drawCenterOverlay(ctx, title, subtitle) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.58)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      roundedRect(ctx, 405, 238, 470, 190, 28);
      ctx.fillStyle = 'rgba(5, 14, 17, .92)';
      ctx.fill();
      ctx.strokeStyle = title === '胜利' ? '#ffe599' : '#8fffe9';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawText(ctx, title, WIDTH / 2, 310, 48, title === '失败' ? '#ffb0bd' : '#ffe599', 'center', '900');
      drawText(ctx, subtitle, WIDTH / 2, 370, 18, '#d9fff6', 'center', '700');
      ctx.restore();
    }

    formatTime(seconds) {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }
  }

  window.AetherlineGame = AetherlineGame;
})();
