import crypto from 'node:crypto';
import { query } from '../config/db.js';

export const DEFAULT_CATEGORIES = [
  { name: 'Educational', icon: '📚', color: '#3B82F6', isDefault: true },
  { name: 'Romantic', icon: '❤️', color: '#EC4899', isDefault: true },
  { name: 'Funny', icon: '😂', color: '#F59E0B', isDefault: true },
  { name: 'Motivational', icon: '🔥', color: '#EF4444', isDefault: true },
  { name: 'Coding & Tech', icon: '💻', color: '#10B981', isDefault: true },
  { name: 'Food & Recipes', icon: '🍕', color: '#F97316', isDefault: true },
  { name: 'Music & Dance', icon: '🎵', color: '#8B5CF6', isDefault: true },
  { name: 'Fitness & Health', icon: '💪', color: '#06B6D4', isDefault: true },
  { name: 'Inspirational', icon: '✨', color: '#14B8A6', isDefault: true },
  { name: 'Other', icon: '📌', color: '#64748B', isDefault: true }
];

export class Category {
  constructor(data = {}) {
    this.id = data.id;
    this._id = data.id;
    this.user = data.user_id || data.user;
    this.name = data.name;
    this.icon = data.icon || '📌';
    this.color = data.color || '#6366F1';
    this.isDefault = Boolean(data.is_default ?? data.isDefault);
    this.createdAt = data.createdAt || data.created_at;
    this.updatedAt = data.updatedAt || data.updated_at;
  }

  toObject() {
    return {
      id: this.id,
      _id: this.id,
      user: this.user,
      name: this.name,
      icon: this.icon,
      color: this.color,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  async save() {
    const res = await query(
      `UPDATE categories
       SET name = $1, icon = $2, color = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, name, icon, color, is_default, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [this.name, this.icon, this.color, this.id, this.user]
    );

    if (res.rows.length > 0) {
      const row = res.rows[0];
      this.name = row.name;
      this.icon = row.icon;
      this.color = row.color;
      this.updatedAt = row.updatedAt;
    }
    return this;
  }

  static find(filter = {}) {
    const userId = filter.user?._id || filter.user;

    const queryPromise = async (sortOrder = 'is_default DESC, name ASC') => {
      const res = await query(
        `SELECT id, user_id, name, icon, color, is_default, created_at AS "createdAt", updated_at AS "updatedAt"
         FROM categories
         WHERE user_id = $1
         ORDER BY ${sortOrder}`,
        [userId]
      );
      return res.rows.map((row) => new Category(row));
    };

    return {
      sort(sortObj) {
        let order = 'is_default DESC, name ASC';
        if (sortObj && typeof sortObj === 'object') {
          if (sortObj.name === 1 && sortObj.isDefault === -1) {
            order = 'is_default DESC, name ASC';
          }
        }
        return queryPromise(order);
      },
      then(resolve, reject) {
        return queryPromise().then(resolve, reject);
      }
    };
  }

  static async findOne(filter = {}) {
    let sql = `
      SELECT id, user_id, name, icon, color, is_default, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM categories
      WHERE 1=1
    `;
    const params = [];

    const userId = filter.user?._id || filter.user;
    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $${params.length}`;
    }

    const catId = filter._id || filter.id;
    if (catId) {
      if (typeof catId === 'object' && catId.$ne) {
        params.push(catId.$ne);
        sql += ` AND id != $${params.length}`;
      } else {
        params.push(catId);
        sql += ` AND id = $${params.length}`;
      }
    }

    if (filter.name) {
      let nameStr = '';
      if (typeof filter.name === 'string') {
        nameStr = filter.name;
      } else if (filter.name instanceof RegExp) {
        nameStr = filter.name.source.replace(/^\^|\$$/g, '');
      } else if (typeof filter.name === 'object' && filter.name.$regex) {
        const r = filter.name.$regex;
        nameStr = (r instanceof RegExp ? r.source : String(r)).replace(/^\^|\$$/g, '');
      }
      params.push(nameStr.trim());
      sql += ` AND LOWER(name) = LOWER($${params.length})`;
    }

    sql += ' LIMIT 1';
    const res = await query(sql, params);
    if (res.rows.length === 0) return null;
    return new Category(res.rows[0]);
  }

  static async findById(id) {
    if (!id) return null;
    const res = await query(
      `SELECT id, user_id, name, icon, color, is_default, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM categories WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return new Category(res.rows[0]);
  }

  static async create({ user, name, color, icon, isDefault = false }) {
    const id = crypto.randomUUID();
    const userId = user?._id || user;
    const res = await query(
      `INSERT INTO categories (id, user_id, name, color, icon, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, name, icon, color, is_default, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, userId, name.trim(), color || '#6366F1', icon || '📌', Boolean(isDefault)]
    );
    return new Category(res.rows[0]);
  }

  static async insertMany(docs = []) {
    const results = [];
    for (const doc of docs) {
      const created = await Category.create(doc);
      results.push(created);
    }
    return results;
  }

  static async deleteOne(filter = {}) {
    const id = filter._id || filter.id;
    const userId = filter.user?._id || filter.user;
    const res = await query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return { deletedCount: res.rowCount };
  }

  static async countDocuments(filter = {}) {
    let sql = 'SELECT COUNT(*)::int AS count FROM categories WHERE 1=1';
    const params = [];

    const userId = filter.user?._id || filter.user;
    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $${params.length}`;
    }

    const res = await query(sql, params);
    return res.rows[0]?.count || 0;
  }
}

export default Category;
