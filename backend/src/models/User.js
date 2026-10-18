import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { query } from '../config/db.js';

export class User {
  constructor(data = {}) {
    this.id = data.id;
    this._id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.createdAt = data.createdAt || data.created_at;
    this.updatedAt = data.updatedAt || data.updated_at;
  }

  async comparePassword(candidatePassword) {
    if (!this.password || !candidatePassword) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }

  select() {
    return this;
  }

  toObject() {
    return {
      id: this.id,
      _id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  async save() {
    let hashedPassword = this.password;
    if (this.password && !this.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(this.password, salt);
    }

    const res = await query(
      `UPDATE users
       SET name = $1, password = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, email, password, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [this.name, hashedPassword, this.id]
    );

    if (res.rows.length > 0) {
      this.password = res.rows[0].password;
      this.updatedAt = res.rows[0].updatedAt;
    }
    return this;
  }

  static async create({ name, email, password }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = crypto.randomUUID();

    const res = await query(
      `INSERT INTO users (id, name, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, password, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    return new User(res.rows[0]);
  }

  static findOne(filter = {}) {
    const exec = async () => {
      if (filter.email) {
        const res = await query(
          `SELECT id, name, email, password, created_at AS "createdAt", updated_at AS "updatedAt"
           FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [filter.email.trim()]
        );
        if (res.rows.length === 0) return null;
        return new User(res.rows[0]);
      }

      const id = filter._id || filter.id;
      if (id) {
        const res = await query(
          `SELECT id, name, email, password, created_at AS "createdAt", updated_at AS "updatedAt"
           FROM users WHERE id = $1 LIMIT 1`,
          [id]
        );
        if (res.rows.length === 0) return null;
        return new User(res.rows[0]);
      }

      return null;
    };

    return {
      select() {
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
        select() {
          return this;
        },
        then(resolve) {
          return Promise.resolve(null).then(resolve);
        }
      };
    }

    const exec = async () => {
      const res = await query(
        `SELECT id, name, email, password, created_at AS "createdAt", updated_at AS "updatedAt"
         FROM users WHERE id = $1 LIMIT 1`,
        [id]
      );
      if (res.rows.length === 0) return null;
      return new User(res.rows[0]);
    };

    return {
      select() {
        return this;
      },
      then(resolve, reject) {
        return exec().then(resolve, reject);
      }
    };
  }
}

export default User;
