let t01 = require("../common/00_pre_configurations");
let t1a = require("../common/1a_table_operations");
let t1b = require("../common/1b_table_column_operations");
let t1c = require("../common/1c_sql_view");
let t1d = require("../common/1d_table_view_drag_drop_reorder");
let t1e = require("../common/1e_meta_sync");
let t2a = require("../common/2a_table_with_belongs_to_colulmn");
let t2b = require("../common/2b_table_with_m2m_column");
let t3a = require("../common/3a_filter_sort_fields_operations");
let t3b = require("../common/3b_formula_column");
let t3c = require("../common/3c_lookup_column");
let t3d = require("../common/3d_rollup_column");
let t3e = require("../common/3e_duration_column");
const {
    setCurrentMode,
} = require("../../support/page_objects/projectConstants");

const nocoTestSuite = (apiType, dbType) => {
    setCurrentMode(apiType, dbType);
    t01.genTest(apiType, dbType);

    t1a.genTest(apiType, dbType);
    t1b.genTest(apiType, dbType);
    t1c.genTest(apiType, dbType);
    // NcGUI v2 t1d.genTest(apiType, dbType);
    t1e.genTest(apiType, dbType);
    t2a.genTest(apiType, dbType);
    t2b.genTest(apiType, dbType);
    t3a.genTest(apiType, dbType);
    t3b.genTest(apiType, dbType);
    t3c.genTest(apiType, dbType);
    t3d.genTest(apiType, dbType);
    // NcGUI v2 t3e.genTest(apiType, dbType);
};

nocoTestSuite("rest", "xcdb");

/**
 * @copyright Copyright (c) 2021, Xgene Cloud Ltd
 *
 * @author Raju Udava <sivadstala@gmail.com>
 * @author Wing-Kam Wong <wingkwong.code@gmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
