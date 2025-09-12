#!/usr/bin/env python3
"""
DuckDB 数据导出脚本
将 DuckDB 中的数据导出为 JSON 格式，供 Rust 迁移工具使用
"""

import duckdb
import json
import os
from pathlib import Path

def export_table_to_json(conn, table_name, output_dir):
    """导出单个表到 JSON 文件"""
    try:
        # 查询表数据
        result = conn.execute(f"SELECT * FROM {table_name}").fetchall()
        columns = [desc[0] for desc in conn.description]
        
        # 转换为字典列表
        data = []
        for row in result:
            row_dict = {}
            for i, value in enumerate(row):
                # 处理特殊数据类型
                if isinstance(value, bytes):
                    row_dict[columns[i]] = value.decode('utf-8', errors='ignore')
                else:
                    row_dict[columns[i]] = value
            data.append(row_dict)
        
        # 写入 JSON 文件
        output_file = os.path.join(output_dir, f"{table_name}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"✅ 导出表 {table_name}: {len(data)} 条记录 -> {output_file}")
        return len(data)
        
    except Exception as e:
        print(f"❌ 导出表 {table_name} 失败: {e}")
        return 0

def main():
    # DuckDB 数据库文件路径
    duckdb_path = "../db/aione_monihub.db"
    
    # 输出目录
    output_dir = "../db/exports"
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    if not os.path.exists(duckdb_path):
        print(f"❌ DuckDB 文件不存在: {duckdb_path}")
        return
    
    print("🚀 开始导出 DuckDB 数据...")
    
    try:
        # 连接到 DuckDB
        conn = duckdb.connect(duckdb_path)
        print(f"✅ 已连接到 DuckDB: {duckdb_path}")
        
        # 获取所有表名
        tables_result = conn.execute("SHOW TABLES").fetchall()
        tables = [table[0] for table in tables_result]
        
        if not tables:
            print("⚠️  数据库中没有找到任何表")
            return
        
        print(f"📋 找到 {len(tables)} 个表: {', '.join(tables)}")
        
        total_records = 0
        
        # 导出每个表
        for table in tables:
            records = export_table_to_json(conn, table, output_dir)
            total_records += records
        
        print(f"\n🎉 导出完成！总共导出 {total_records} 条记录")
        print(f"📁 导出文件位置: {output_dir}")
        
        # 生成导出摘要
        summary = {
            "export_time": str(conn.execute("SELECT current_timestamp").fetchone()[0]),
            "source_database": duckdb_path,
            "total_tables": len(tables),
            "total_records": total_records,
            "tables": {}
        }
        
        for table in tables:
            table_file = os.path.join(output_dir, f"{table}.json")
            if os.path.exists(table_file):
                with open(table_file, 'r', encoding='utf-8') as f:
                    table_data = json.load(f)
                    summary["tables"][table] = len(table_data)
        
        # 保存导出摘要
        summary_file = os.path.join(output_dir, "export_summary.json")
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"📊 导出摘要已保存: {summary_file}")
        
    except Exception as e:
        print(f"❌ 导出过程中发生错误: {e}")
    
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()