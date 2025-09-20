// 游戏工具函数

import type { Vector2D } from '@/types/game';

export class GameUtils {
  // 向量运算
  static distance(a: Vector2D, b: Vector2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static normalize(vector: Vector2D): Vector2D {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: 0 };

    return {
      x: vector.x / length,
      y: vector.y / length
    };
  }

  static add(a: Vector2D, b: Vector2D): Vector2D {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  }

  static subtract(a: Vector2D, b: Vector2D): Vector2D {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  }

  static multiply(vector: Vector2D, scalar: number): Vector2D {
    return {
      x: vector.x * scalar,
      y: vector.y * scalar
    };
  }

  // 角度计算
  static angle(a: Vector2D, b: Vector2D): number {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  static angleToDirection(angle: number): 'up' | 'down' | 'left' | 'right' {
    const radians = angle * (Math.PI / 180);
    const normalizedAngle = ((radians % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    if (normalizedAngle >= Math.PI * 7/4 || normalizedAngle < Math.PI * 1/4) {
      return 'right';
    } else if (normalizedAngle >= Math.PI * 1/4 && normalizedAngle < Math.PI * 3/4) {
      return 'down';
    } else if (normalizedAngle >= Math.PI * 3/4 && normalizedAngle < Math.PI * 5/4) {
      return 'left';
    } else {
      return 'up';
    }
  }

  // 边界检查
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static clampVector(position: Vector2D, min: Vector2D, max: Vector2D): Vector2D {
    return {
      x: this.clamp(position.x, min.x, max.x),
      y: this.clamp(position.y, min.y, max.y)
    };
  }

  // 线性插值
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  static lerpVector(start: Vector2D, end: Vector2D, t: number): Vector2D {
    return {
      x: this.lerp(start.x, end.x, t),
      y: this.lerp(start.y, end.y, t)
    };
  }

  // 随机数生成
  static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max));
  }

  static randomPosition(min: Vector2D, max: Vector2D): Vector2D {
    return {
      x: this.random(min.x, max.x),
      y: this.random(min.y, max.y)
    };
  }

  // 碰撞检测
  static rectCollision(rect1: { x: number; y: number; width: number; height: number },
                      rect2: { x: number; y: number; width: number; height: number }): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  static circleCollision(center1: Vector2D, radius1: number,
                        center2: Vector2D, radius2: number): boolean {
    const distance = this.distance(center1, center2);
    return distance < radius1 + radius2;
  }

  // 时间工具
  static deltaTime(): number {
    return 1 / 60; // 60 FPS
  }

  static formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
  }

  // 性能监控
  static performanceMonitor(): {
    fps: number;
    frameTime: number;
    memory: number;
  } {
    const memory = (performance as any).memory;
    return {
      fps: 60, // 简化实现
      frameTime: 16.67, // 60 FPS
      memory: memory ? memory.usedJSHeapSize : 0
    };
  }

  // 数学工具
  static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  // 路径查找辅助
  static findPath(start: Vector2D, end: Vector2D, obstacles: any[]): Vector2D[] {
    // 简化的A*算法实现
    // 这里先返回直线路径，后续可以实现完整的A*算法
    return [start, end];
  }
}