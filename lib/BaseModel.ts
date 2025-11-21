import { db } from "../config/database";

export class BaseModel<T extends Record<string, any>> {
  constructor(
    protected tableName: string,
    protected primaryKey: string
  ) {}

  async findMany(where: Partial<T> = {}): Promise<T[]> {
    try {
      const conditions = Object.keys(where);
      
      if (conditions.length === 0) {
        const sql = `SELECT * FROM ${this.tableName}`;
        return await db.all<T>(sql);
      }

      const whereClause = conditions.map(key => `${key} = ?`).join(' AND ');
      const values = conditions.map(key => where[key]);
      
      const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
      return await db.all<T>(sql, ...values);
    } catch (error) {
      console.error(`Error in findMany for ${this.tableName}:`, error);
      throw error;
    }
  }

  async findUnique(where: Partial<T>): Promise<T | null> {
    try {
      const conditions = Object.keys(where);
      const whereClause = conditions.map(key => `${key} = ?`).join(' AND ');
      const values = conditions.map(key => where[key]);
      
      const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
      const result = await db.get<T>(sql, ...values);
      
      return result || null;
    } catch (error) {
      console.error(`Error in findUnique for ${this.tableName}:`, error);
      throw error;
    }
  }

  async findById(id: number | string): Promise<T | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ? LIMIT 1`;
      const result = await db.get<T>(sql, id);
      
      return result || null;
    } catch (error) {
      console.error(`Error in findById for ${this.tableName}:`, error);
      throw error;
    }
  }

  async create(data: Omit<T, typeof this.primaryKey | 'created_at' | 'updated_at'>): Promise<T | null> {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
      const result = await db.run(sql, ...values);
      
      if (result.lastID) {
        return await this.findById(result.lastID);
      }
      
      return null;
    } catch (error) {
      console.error(`Error in create for ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(where: Partial<T>, data: Partial<T>): Promise<boolean> {
    try {
      const dataKeys = Object.keys(data);
      const setClause = dataKeys.map(key => `${key} = ?`).join(', ');
      const dataValues = dataKeys.map(key => data[key]);
      
      const whereKeys = Object.keys(where);
      const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
      const whereValues = whereKeys.map(key => where[key]);
      
      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause}`;
      const result = await db.run(sql, ...dataValues, ...whereValues);
      
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error(`Error in update for ${this.tableName}:`, error);
      throw error;
    }
  }

  async updateById(id: number | string, data: Partial<T>): Promise<boolean> {
    try {
      const keys = Object.keys(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = keys.map(key => data[key]);
      
      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
      const result = await db.run(sql, ...values, id);
      
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error(`Error in updateById for ${this.tableName}:`, error);
      throw error;
    }
  }

  async delete(where: Partial<T>): Promise<boolean> {
    try {
      const conditions = Object.keys(where);
      const whereClause = conditions.map(key => `${key} = ?`).join(' AND ');
      const values = conditions.map(key => where[key]);
      
      const sql = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;
      const result = await db.run(sql, ...values);
      
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error(`Error in delete for ${this.tableName}:`, error);
      throw error;
    }
  }

  async deleteById(id: number | string): Promise<boolean> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
      const result = await db.run(sql, id);
      
      return (result.changes ?? 0) > 0;
    } catch (error) {
      console.error(`Error in deleteById for ${this.tableName}:`, error);
      throw error;
    }
  }

  async count(where: Partial<T> = {}): Promise<number> {
    try {
      const conditions = Object.keys(where);
      
      if (conditions.length === 0) {
        const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const result = await db.get<{ count: number }>(sql);
        return result?.count ?? 0;
      }

      const whereClause = conditions.map(key => `${key} = ?`).join(' AND ');
      const values = conditions.map(key => where[key]);
      
      const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`;
      const result = await db.get<{ count: number }>(sql, ...values);
      
      return result?.count ?? 0;
    } catch (error) {
      console.error(`Error in count for ${this.tableName}:`, error);
      throw error;
    }
  }

  async exists(where: Partial<T>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async findManyPaginated(
    where: Partial<T> = {},
    limit: number = 10,
    offset: number = 0,
    orderBy?: { column: keyof T; direction: 'ASC' | 'DESC' }
  ): Promise<T[]> {
    try {
      const conditions = Object.keys(where);
      let sql = `SELECT * FROM ${this.tableName}`;
      const values: any[] = [];

      if (conditions.length > 0) {
        const whereClause = conditions.map(key => `${key} = ?`).join(' AND ');
        values.push(...conditions.map(key => where[key]));
        sql += ` WHERE ${whereClause}`;
      }

      if (orderBy) {
        sql += ` ORDER BY ${String(orderBy.column)} ${orderBy.direction}`;
      }

      sql += ` LIMIT ? OFFSET ?`;
      values.push(limit, offset);

      return await db.all<T>(sql, ...values);
    } catch (error) {
      console.error(`Error in findManyPaginated for ${this.tableName}:`, error);
      throw error;
    }
  }
}