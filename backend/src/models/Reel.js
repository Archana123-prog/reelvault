import crypto from 'node:crypto';
import { query } from '../config/db.js';

export const formatReelRow = (row) => {
  if (!row) return null;

  let tags = [];
  if (Array.isArray(row.tags)) {
    tags = row.tags;
  } else if (typeof row.tags === 'string') {
    try {
      tags = JSON.parse(row.tags);
    } catch {
      tags = [];
    }
  }

  const category = row.category_id
    ? {
        _id: row.category_id,
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon
      }
    : null;

  return {
    _id: row.id,
    id: row.id,
    user: row.user_id,
    url: row.url,
    platform: row.platform,
    title: row.title || '',
    note: row.note || '',
    tags,
    thumbnail: row.thumbnail,
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at,
    category
  };
};

const buildFilterConditions = (filter = {}) => {
  const conditions = [];
  const params = [];

  const userId = filter.user?._id || filter.user;
  if (userId) {
    params.push(userId);
    conditions.push(`r.user_id = $${params.length}`);
  }

  const catId = filter.category?._id || filter.category;
  if (catId && catId !== 'all') {
    params.push(catId);
    conditions.push(`r.category_id = $${params.length}`);
  }

  if (filter.platform && filter.platform !== 'all') {
    params.push(filter.platform.toLowerCase());
    conditions.push(`LOWER(r.platform) = $${params.length}`);
  }

  if (filter.isFavorite !== undefined && filter.isFavorite !== null) {
    params.push(Boolean(filter.isFavorite));
    conditions.push(`r.is_favorite = $${params.length}`);
  }

  if (filter.url) {
    params.push(filter.url);
    conditions.push(`r.url = $${params.length}`);
  }

  const reelId = filter._id || filter.id;
  if (reelId) {
    params.push(reelId);
    conditions.push(`r.id = $${params.length}`);
  }

  // Handle keyword search ($or: [ { title: regex }, { note: regex }, { tags: regex } ])
  if (filter.$or && Array.isArray(filter.$or)) {
    let searchTerm = null;
    for (const condition of filter.$or) {
      const regexVal = condition.title?.$regex || condition.note?.$regex || condition.tags?.$regex;
      if (regexVal) {
        searchTerm = typeof regexVal === 'string' ? regexVal : regexVal.source;
        break;
      }
    }

    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      const pIdx = params.length;
      conditions.push(`(r.title ILIKE $${pIdx} OR r.note ILIKE $${pIdx} OR r.tags::text ILIKE $${pIdx})`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
};

export class ReelQuery {
  constructor(filter) {
    this.filter = filter;
    this.sortOrder = 'newest';
    this.skipNum = 0;
    this.limitNum = 12;
  }

  sort(sortObj) {
    if (sortObj && (sortObj.createdAt === 1 || sortObj === 'oldest')) {
      this.sortOrder = 'oldest';
    } else {
      this.sortOrder = 'newest';
    }
    return this;
  }

  skip(n) {
    this.skipNum = Math.max(0, parseInt(n, 10) || 0);
    return this;
  }

  limit(n) {
    this.limitNum = Math.min(100, Math.max(1, parseInt(n, 10) || 12));
    return this;
  }

  populate() {
    return this;
  }

  lean() {
    return this;
  }

  async exec() {
    const { whereClause, params } = buildFilterConditions(this.filter);
    const orderClause = this.sortOrder === 'oldest' ? 'ORDER BY r.created_at ASC' : 'ORDER BY r.created_at DESC';

    params.push(this.limitNum);
    const limitParam = `$${params.length}`;
    params.push(this.skipNum);
    const offsetParam = `$${params.length}`;

    const sql = `
      SELECT
        r.id, r.user_id, r.url, r.platform, r.title, r.note, r.tags, r.thumbnail, r.is_favorite,
        r.created_at AS "createdAt", r.updated_at AS "updatedAt",
        c.id AS category_id, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
      FROM reels r
      LEFT JOIN categories c ON r.category_id = c.id
      ${whereClause}
      ${orderClause}
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const res = await query(sql, params);
    return res.rows.map((row) => formatReelRow(row));
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

export class Reel {
  constructor(data = {}) {
    const formatted = formatReelRow(data);
    Object.assign(this, formatted);
  }

  populate() {
    return this;
  }

  toObject() {
    return {
      id: this.id,
      _id: this.id,
      user: this.user,
      url: this.url,
      platform: this.platform,
      title: this.title,
      note: this.note,
      tags: this.tags,
      thumbnail: this.thumbnail,
      isFavorite: this.isFavorite,
      category: this.category,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  async save() {
    const catId = this.category?._id || this.category || null;

    const res = await query(
      `UPDATE reels
       SET category_id = $1, title = $2, note = $3, tags = $4, thumbnail = $5, is_favorite = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        catId,
        this.title || '',
        this.note || '',
        JSON.stringify(this.tags || []),
        this.thumbnail || null,
        Boolean(this.isFavorite),
        this.id,
        this.user
      ]
    );

    if (res.rows.length > 0) {
      const updated = formatReelRow(res.rows[0]);
      this.title = updated.title;
      this.note = updated.note;
      this.tags = updated.tags;
      this.thumbnail = updated.thumbnail;
      this.isFavorite = updated.isFavorite;
      this.updatedAt = updated.updatedAt;
    }
    return this;
  }

  static find(filter = {}) {
    return new ReelQuery(filter);
  }

  static async countDocuments(filter = {}) {
    const { whereClause, params } = buildFilterConditions(filter);
    const sql = `SELECT COUNT(*)::int AS count FROM reels r ${whereClause}`;
    const res = await query(sql, params);
    return res.rows[0]?.count || 0;
  }

  static findOne(filter = {}) {
    const exec = async () => {
      const { whereClause, params } = buildFilterConditions(filter);
      const sql = `
        SELECT
          r.id, r.user_id, r.url, r.platform, r.title, r.note, r.tags, r.thumbnail, r.is_favorite,
          r.created_at AS "createdAt", r.updated_at AS "updatedAt",
          c.id AS category_id, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
        FROM reels r
        LEFT JOIN categories c ON r.category_id = c.id
        ${whereClause}
        LIMIT 1
      `;
      const res = await query(sql, params);
      if (res.rows.length === 0) return null;
      return new Reel(res.rows[0]);
    };

    return {
      populate() {
        return this;
      },
      lean() {
        return this;
      },
      then(resolve, reject) {
        return exec().then(resolve, reject);
      }
    };
  }

  static findById(id) {
    if (!id) {
      return {
        populate() {
          return this;
        },
        lean() {
          return this;
        },
        then(resolve) {
          return Promise.resolve(null).then(resolve);
        }
      };
    }

    const exec = async () => {
      const sql = `
        SELECT
          r.id, r.user_id, r.url, r.platform, r.title, r.note, r.tags, r.thumbnail, r.is_favorite,
          r.created_at AS "createdAt", r.updated_at AS "updatedAt",
          c.id AS category_id, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
        FROM reels r
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE r.id = $1
        LIMIT 1
      `;
      const res = await query(sql, [id]);
      if (res.rows.length === 0) return null;
      return new Reel(res.rows[0]);
    };

    return {
      populate() {
        return this;
      },
      lean() {
        return this;
      },
      then(resolve, reject) {
        return exec().then(resolve, reject);
      }
    };
  }

  static async create({ user, url, platform = 'other', category, title = '', note = '', tags = [], thumbnail = null, isFavorite = false }) {
    const id = crypto.randomUUID();
    const userId = user?._id || user;
    const catId = category?._id || category || null;

    const res = await query(
      `INSERT INTO reels (id, user_id, category_id, url, platform, title, note, tags, thumbnail, is_favorite)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        userId,
        catId,
        url,
        platform || 'other',
        title || '',
        note || '',
        JSON.stringify(Array.isArray(tags) ? tags : []),
        thumbnail || null,
        Boolean(isFavorite)
      ]
    );

    return Reel.findById(id);
  }

  static async findOneAndDelete(filter = {}) {
    const id = filter._id || filter.id;
    const userId = filter.user?._id || filter.user;
    const res = await query(
      'DELETE FROM reels WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    if (res.rows.length === 0) return null;
    return { _id: id, id };
  }

  static async updateMany(filter = {}, update = {}) {
    const userId = filter.user?._id || filter.user;
    const catId = filter.category?._id || filter.category;
    const newCatId = update.$set?.category?._id || update.$set?.category || update.category;

    const res = await query(
      'UPDATE reels SET category_id = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND category_id = $3',
      [newCatId, userId, catId]
    );
    return { modifiedCount: res.rowCount };
  }

  static async aggregate(pipeline = []) {
    // Specifically handle category count aggregation:
    // [{ $match: { user: req.user._id } }, { $group: { _id: '$category', count: { $sum: 1 } } }]
    let userId = null;
    for (const stage of pipeline) {
      if (stage.$match && stage.$match.user) {
        userId = stage.$match.user._id || stage.$match.user;
      }
    }

    if (userId) {
      const res = await query(
        `SELECT category_id AS _id, COUNT(*)::int AS count
         FROM reels
         WHERE user_id = $1 AND category_id IS NOT NULL
         GROUP BY category_id`,
        [userId]
      );
      return res.rows;
    }

    return [];
  }

  static async insertMany(docs = []) {
    const results = [];
    for (const doc of docs) {
      const created = await Reel.create(doc);
      results.push(created);
    }
    return results;
  }
}

export default Reel;
