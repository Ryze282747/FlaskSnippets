const databaseSnippets = [
  // Queries
  {
    id: "database:query-all",
    name: "Query All Records",
    prefix: "queryall",
    category: "database",
    description: "Retrieve all records from a SQLAlchemy model.",
    body: [
      "${1:items} = ${2:Item}.query.all()"
    ],
    tags: [ "sqlalchemy", "query", "select" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-get",
    name: "Get Record by ID",
    prefix: "queryget",
    category: "database",
    description: "Retrieve a record by its primary key.",
    body: [
      "${1:item} = db.session.get(${2:Item}, ${3:item_id})"
    ],
    tags: [ "sqlalchemy", "query", "primary-key" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-first",
    name: "Query First Record",
    prefix: "queryfirst",
    category: "database",
    description: "Retrieve the first matching record.",
    body: [
      "${1:item} = ${2:Item}.query.filter_by(${3:name}=${4:value}).first()"
    ],
    tags: [ "sqlalchemy", "query", "filter" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-filter",
    name: "Filter Records",
    prefix: "queryfilter",
    category: "database",
    description: "Filter records using SQLAlchemy expressions.",
    body: [
      "${1:items} = ${2:Item}.query.filter(",
      "    ${2:Item}.${3:active} == ${4:True}",
      ").all()"
    ],
    tags: [ "sqlalchemy", "query", "filter" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-filter-by",
    name: "Filter by Column Values",
    prefix: "queryfilterby",
    category: "database",
    description: "Filter records using keyword arguments.",
    body: [
      "${1:items} = ${2:Item}.query.filter_by(",
      "    ${3:active}=${4:True}",
      ").all()"
    ],
    tags: [ "sqlalchemy", "query", "filter" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-order",
    name: "Order Query Results",
    prefix: "queryorder",
    category: "database",
    description: "Sort query results by a column.",
    body: [
      "${1:items} = ${2:Item}.query.order_by(",
      "    ${2:Item}.${3:created_at}.desc()",
      ").all()"
    ],
    tags: [ "sqlalchemy", "query", "sorting" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-count",
    name: "Count Records",
    prefix: "querycount",
    category: "database",
    description: "Count records matching a query.",
    body: [
      "${1:total} = ${2:Item}.query.filter_by(",
      "    ${3:active}=${4:True}",
      ").count()"
    ],
    tags: [ "sqlalchemy", "query", "count" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-exists",
    name: "Check Record Exists",
    prefix: "queryexists",
    category: "database",
    description: "Check whether a matching record exists.",
    body: [
      "${1:exists} = db.session.query(",
      "    db.session.query(${2:Item}).filter_by(",
      "        ${3:name}=${4:value}",
      "    ).exists()",
      ").scalar()"
    ],
    tags: [ "sqlalchemy", "query", "exists" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-like",
    name: "Search with LIKE",
    prefix: "querylike",
    category: "database",
    description: "Search text columns using a case-insensitive match.",
    body: [
      "${1:items} = ${2:Item}.query.filter(",
      "    ${2:Item}.${3:name}.ilike(",
      "        \"%\" + ${4:search_term} + \"%\"",
      "    )",
      ").all()"
    ],
    tags: [ "sqlalchemy", "query", "search" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-in",
    name: "Filter with IN",
    prefix: "queryin",
    category: "database",
    description: "Retrieve records whose column matches one of several values.",
    body: [
      "${1:items} = ${2:Item}.query.filter(",
      "    ${2:Item}.${3:id}.in_(${4:item_ids})",
      ").all()"
    ],
    tags: [ "sqlalchemy", "query", "filter" ],
    scope: [ "python" ]
  },
  {
    id: "database:create",
    name: "Create Database Record",
    prefix: "dbcreate",
    category: "database",
    description: "Create and save a new database record.",
    body: [
      "${1:item} = ${2:Item}(",
      "    ${3:name}=${4:name}",
      ")",
      "",
      "db.session.add(${1:item})",
      "db.session.commit()"
    ],
    tags: [ "sqlalchemy", "create", "insert" ],
    scope: [ "python" ]
  },
  {
    id: "database:update",
    name: "Update Database Record",
    prefix: "dbupdate",
    category: "database",
    description: "Update an existing database record.",
    body: [
      "${1:item} = db.session.get(${2:Item}, ${3:item_id})",
      "",
      "if ${1:item} is not None:",
      "    ${1:item}.${4:name} = ${5:new_value}",
      "    db.session.commit()"
    ],
    tags: [ "sqlalchemy", "update" ],
    scope: [ "python" ]
  },
  {
    id: "database:delete",
    name: "Delete Database Record",
    prefix: "dbdelete",
    category: "database",
    description: "Delete an existing database record.",
    body: [
      "${1:item} = db.session.get(${2:Item}, ${3:item_id})",
      "",
      "if ${1:item} is not None:",
      "    db.session.delete(${1:item})",
      "    db.session.commit()"
    ],
    tags: [ "sqlalchemy", "delete" ],
    scope: [ "python" ]
  },
  {
    id: "database:bulk-delete",
    name: "Delete Matching Records",
    prefix: "dbbulkdelete",
    category: "database",
    description: "Delete records matching a filter and return the number deleted.",
    body: [
      "${1:deleted_count} = ${2:Item}.query.filter_by(",
      "    ${3:status}=${4:'inactive'}",
      ").delete(synchronize_session=\"fetch\")",
      "",
      "db.session.commit()"
    ],
    tags: [ "sqlalchemy", "delete", "bulk" ],
    scope: [ "python" ]
  },
  {
    id: "database:pagination",
    name: "Paginate Query",
    prefix: "dbpaginate",
    category: "database",
    description: "Paginate database results using request parameters.",
    body: [
      "${1:pagination} = ${2:Item}.query.order_by(",
      "    ${2:Item}.id.desc()",
      ").paginate(",
      "    page=${3:request.args.get(\"page\", 1, type=int)},",
      "    per_page=${4:10},",
      "    error_out=False",
      ")",
      "",
      "${5:items} = ${1:pagination}.items",
      "${6:total_pages} = ${1:pagination}.pages"
    ],
    tags: [ "sqlalchemy", "pagination" ],
    scope: [ "python" ]
  },
  {
    id: "database:relationship-one-to-many",
    name: "One-to-Many Relationship",
    prefix: "dbonetomany",
    category: "database",
    description: "Define a one-to-many relationship between two models.",
    body: [
      "class ${1:Author}(db.Model):",
      "    id = db.Column(db.Integer, primary_key=True)",
      "    ${2:posts} = db.relationship(",
      "        \"${3:Post}\",",
      "        back_populates=\"${4:author}\"",
      "    )",
      "",
      "class ${3:Post}(db.Model):",
      "    id = db.Column(db.Integer, primary_key=True)",
      "    ${5:author_id} = db.Column(",
      "        db.Integer,",
      "        db.ForeignKey(\"${6:author.id}\"),",
      "        nullable=False",
      "    )",
      "    ${4:author} = db.relationship(",
      "        \"${1:Author}\",",
      "        back_populates=\"${2:posts}\"",
      "    )"
    ],
    tags: [ "sqlalchemy", "relationship", "one-to-many" ],
    scope: [ "python" ]
  },
  {
    id: "database:relationship-many-to-many",
    name: "Many-to-Many Relationship",
    prefix: "dbmanytomany",
    category: "database",
    description: "Create a many-to-many relationship using an association table.",
    body: [
      "${1:association_table} = db.Table(",
      "    \"${2:user_roles}\",",
      "    db.metadata,",
      "    db.Column(\"${3:user_id}\", db.ForeignKey(\"${4:user.id}\"), primary_key=True),",
      "    db.Column(\"${5:role_id}\", db.ForeignKey(\"${6:role.id}\"), primary_key=True)",
      ")",
      "",
      "class ${7:User}(db.Model):",
      "    id = db.Column(db.Integer, primary_key=True)",
      "    ${8:roles} = db.relationship(",
      "        \"${9:Role}\",",
      "        secondary=${1:association_table},",
      "        back_populates=\"${10:users}\"",
      "    )",
      "",
      "class ${9:Role}(db.Model):",
      "    id = db.Column(db.Integer, primary_key=True)",
      "    ${10:users} = db.relationship(",
      "        \"${7:User}\",",
      "        secondary=${1:association_table},",
      "        back_populates=\"${8:roles}\"",
      "    )"
    ],
    tags: [ "sqlalchemy", "relationship", "many-to-many" ],
    scope: [ "python" ]
  },
  {
    id: "database:serialize-dict",
    name: "Serialize Model to Dictionary",
    prefix: "dbtodict",
    category: "database",
    description: "Define a to_dict method inside a model to serialize selected fields.",
    body: [
      "def ${1:to_dict}(self):",
      "    return {",
      "        \"id\": self.id,",
      "        \"${2:name}\": self.${2:name}",
      "    }"
    ],
    tags: [ "sqlalchemy", "serialization", "dictionary" ],
    scope: [ "python" ]
  },
  {
    id: "database:serialize-list",
    name: "Serialize Query Results",
    prefix: "dbserialize",
    category: "database",
    description: "Convert model instances into dictionaries using an existing to_dict() method.",
    body: [
      "${1:data} = [",
      "    item.to_dict()",
      "    for item in ${2:items}",
      "]"
    ],
    tags: [ "sqlalchemy", "serialization", "dictionary" ],
    scope: [ "python" ]
  },
  {
    id: "database:transaction",
    name: "Safe Database Transaction",
    prefix: "dbsafecommit",
    category: "database",
    description: "Commit a transaction or roll it back when an exception occurs.",
    body: [
      "try:",
      "    ${1:db.session.add(instance)}",
      "    db.session.commit()",
      "except Exception:",
      "    db.session.rollback()",
      "    raise"
    ],
    tags: [ "sqlalchemy", "transaction", "rollback" ],
    scope: [ "python" ]
  },
  {
    id: "database:select-session",
    name: "SQLAlchemy Select Query",
    prefix: "dbselect",
    category: "database",
    description: "Build a query using SQLAlchemy's select statement.",
    body: [
      "from sqlalchemy import select",
      "",
      "${1:statement} = select(${2:Item}).where(",
      "    ${2:Item}.${3:active}.is_(True)",
      ")",
      "${4:items} = db.session.scalars(${1:statement}).all()"
    ],
    tags: [ "sqlalchemy", "select", "query" ],
    scope: [ "python" ]
  },
  {
    id: "database:join",
    name: "Join Related Models",
    prefix: "dbjoin",
    category: "database",
    description: "Query records using a SQLAlchemy join.",
    body: [
      "${1:results} = db.session.query(${2:User}, ${3:Post}).join(",
      "    ${3:Post},",
      "    ${3:Post}.${4:user_id} == ${2:User}.id",
      ").all()"
    ],
    tags: [ "sqlalchemy", "join", "query" ],
    scope: [ "python" ]
  },
  {
    id: "database:group-by",
    name: "Group Query Results",
    prefix: "dbgroupby",
    category: "database",
    description: "Group and count records using SQLAlchemy.",
    body: [
      "from sqlalchemy import func",
      "",
      "${1:results} = db.session.query(",
      "    ${2:Item}.${3:status},",
      "    func.count(${2:Item}.id)",
      ").group_by(${2:Item}.${3:status}).all()"
    ],
    tags: [ "sqlalchemy", "group-by", "aggregation" ],
    scope: [ "python" ]
  },

  // Dictionary conversion
  {
    id: "database:from-dict",
    name: "Create Model From Dictionary",
    prefix: "dbfromdict",
    category: "database",
    description: "Create a model instance from a dictionary of allowed fields.",
    body: [
      "@classmethod",
      "def ${1:from_dict}(cls, data):",
      "    return cls(",
      "        ${2:name}=data.get('${2:name}'),",
      "        ${3:description}=data.get('${3:description}')",
      "    )"
    ],
    tags: [ "sqlalchemy", "dictionary", "serialization", "model" ],
    scope: [ "python" ]
  },
  {
    id: "database:update-from-dict",
    name: "Update Model From Dictionary",
    prefix: "dbupdatefromdict",
    category: "database",
    description: "Update selected model attributes from a dictionary using an explicit allowlist.",
    body: [
      "def ${1:update_from_dict}(self, data):",
      "    allowed_fields = { '${2:name}', '${3:description}' }",
      "",
      "    for key, value in data.items():",
      "        if key in allowed_fields:",
      "            setattr(self, key, value)"
    ],
    tags: [ "sqlalchemy", "dictionary", "update", "model" ],
    scope: [ "python" ]
  },
  {
    id: "database:serialize-dict-fields",
    name: "Serialize Selected Model Fields",
    prefix: "dbtodictfields",
    category: "database",
    description: "Serialize selected model attributes into a dictionary.",
    body: [
      "def ${1:to_dict}(self):",
      "    return {",
      "        '${2:name}': self.${2:name},",
      "        '${3:description}': self.${3:description}",
      "    }"
    ],
    tags: [ "sqlalchemy", "serialization", "dictionary" ],
    scope: [ "python" ]
  },

  // Advanced queries
  {
    id: "database:query-limit",
    name: "Limit Query Results",
    prefix: "querylimit",
    category: "database",
    description: "Limit the number of records returned by a query.",
    body: [
      "${1:items} = ${2:Item}.query.limit(${3:10}).all()"
    ],
    tags: [ "sqlalchemy", "query", "limit" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-offset",
    name: "Offset Query Results",
    prefix: "queryoffset",
    category: "database",
    description: "Skip a number of records before returning query results.",
    body: [
      "${1:items} = ${2:Item}.query.offset(${3:10}).all()"
    ],
    tags: [ "sqlalchemy", "query", "offset" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-distinct",
    name: "Get Distinct Values",
    prefix: "querydistinct",
    category: "database",
    description: "Retrieve unique values from a database column.",
    body: [
      "${1:values} = db.session.query(",
      "    ${2:Item}.${3:category}",
      ").distinct().all()"
    ],
    tags: [ "sqlalchemy", "query", "distinct" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-between",
    name: "Filter Between Values",
    prefix: "querybetween",
    category: "database",
    description: "Retrieve records where a column falls within a range.",
    body: [
      "${1:items} = ${2:Item}.query.filter(",
      "    ${2:Item}.${3:price}.between(${4:minimum}, ${5:maximum})",
      ").all()"
    ],
    tags: [ "sqlalchemy", "query", "range" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-null",
    name: "Filter NULL Values",
    prefix: "querynull",
    category: "database",
    description: "Find records where a column has a NULL value.",
    body: [
      "${1:items} = ${2:Item}.query.filter(",
      "    ${2:Item}.${3:deleted_at}.is_(None)",
      ").all()"
    ],
    tags: [ "sqlalchemy", "query", "null" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-not-null",
    name: "Filter Non-NULL Values",
    prefix: "querynotnull",
    category: "database",
    description: "Find records where a column is not NULL.",
    body: [
      "${1:items} = ${2:Item}.query.filter(",
      "    ${2:Item}.${3:deleted_at}.is_not(None)",
      ").all()"
    ],
    tags: [ "sqlalchemy", "query", "null" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-or",
    name: "Query With OR Conditions",
    prefix: "queryor",
    category: "database",
    description: "Match records satisfying at least one condition.",
    body: [
      "from sqlalchemy import or_",
      "",
      "${1:items} = ${2:Item}.query.filter(",
      "    or_(",
      "        ${2:Item}.${3:status} == '${4:pending}',",
      "        ${2:Item}.${5:status} == '${6:active}'",
      "    )",
      ").all()"
    ],
    tags: [ "sqlalchemy", "query", "or" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-and",
    name: "Query With AND Conditions",
    prefix: "queryand",
    category: "database",
    description: "Match records satisfying multiple conditions.",
    body: [
      "from sqlalchemy import and_",
      "",
      "${1:items} = ${2:Item}.query.filter(",
      "    and_(",
      "        ${2:Item}.${3:active}.is_(True),",
      "        ${2:Item}.${4:price} > ${5:0}",
      "    )",
      ").all()"
    ],
    tags: [ "sqlalchemy", "query", "and" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-first-or-404",
    name: "Get First Record or 404",
    prefix: "queryfirst404",
    category: "database",
    description: "Retrieve the first matching record or return HTTP 404.",
    body: [
      "${1:item} = ${2:Item}.query.filter_by(",
      "    ${3:slug}=${4:slug}",
      ").first_or_404()"
    ],
    tags: [ "sqlalchemy", "query", "404" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-get-or-404",
    name: "Get Record by ID or 404",
    prefix: "queryget404",
    category: "database",
    description: "Retrieve a record by primary key or return HTTP 404.",
    body: [
      "${1:item} = db.get_or_404(${2:Item}, ${3:item_id})"
    ],
    tags: [ "sqlalchemy", "query", "404" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-sum",
    name: "Calculate Column Sum",
    prefix: "querysum",
    category: "database",
    description: "Calculate the sum of a numeric database column.",
    body: [
      "from sqlalchemy import func",
      "",
      "${1:total} = db.session.query(",
      "    func.sum(${2:Item}.${3:price})",
      ").scalar() or 0"
    ],
    tags: [ "sqlalchemy", "aggregation", "sum" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-average",
    name: "Calculate Column Average",
    prefix: "queryaverage",
    category: "database",
    description: "Calculate the average of a numeric database column.",
    body: [
      "from sqlalchemy import func",
      "",
      "${1:average} = db.session.query(",
      "    func.avg(${2:Item}.${3:price})",
      ").scalar()"
    ],
    tags: [ "sqlalchemy", "aggregation", "average" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-max",
    name: "Get Maximum Column Value",
    prefix: "querymax",
    category: "database",
    description: "Retrieve the maximum value from a database column.",
    body: [
      "from sqlalchemy import func",
      "",
      "${1:maximum} = db.session.query(",
      "    func.max(${2:Item}.${3:price})",
      ").scalar()"
    ],
    tags: [ "sqlalchemy", "aggregation", "maximum" ],
    scope: [ "python" ]
  },
  {
    id: "database:query-min",
    name: "Get Minimum Column Value",
    prefix: "querymin",
    category: "database",
    description: "Retrieve the minimum value from a database column.",
    body: [
      "from sqlalchemy import func",
      "",
      "${1:minimum} = db.session.query(",
      "    func.min(${2:Item}.${3:price})",
      ").scalar()"
    ],
    tags: [ "sqlalchemy", "aggregation", "minimum" ],
    scope: [ "python" ]
  },

  // Database session operations
  {
    id: "database:session-flush",
    name: "Flush Database Session",
    prefix: "dbflush",
    category: "database",
    description: "Send pending changes to the database without committing the transaction.",
    body: [
      "db.session.flush()"
    ],
    tags: [ "sqlalchemy", "session", "flush" ],
    scope: [ "python" ]
  },
  {
    id: "database:session-refresh",
    name: "Refresh Database Object",
    prefix: "dbrefresh",
    category: "database",
    description: "Reload an object's attributes from the database.",
    body: [
      "db.session.refresh(${1:item})"
    ],
    tags: [ "sqlalchemy", "session", "refresh" ],
    scope: [ "python" ]
  },
  {
    id: "database:session-rollback",
    name: "Rollback Database Session",
    prefix: "dbrollback",
    category: "database",
    description: "Undo uncommitted changes in the current database transaction.",
    body: [
      "db.session.rollback()"
    ],
    tags: [ "sqlalchemy", "session", "rollback" ],
    scope: [ "python" ]
  },
  {
    id: "database:session-commit",
    name: "Commit Database Session",
    prefix: "dbcommit",
    category: "database",
    description: "Commit pending changes in the current database transaction.",
    body: [
      "db.session.commit()"
    ],
    tags: [ "sqlalchemy", "session", "commit" ],
    scope: [ "python" ]
  },
  {
    id: "database:session-add-all",
    name: "Add Multiple Records",
    prefix: "dbaddall",
    category: "database",
    description: "Add multiple model instances to the current session.",
    body: [
      "db.session.add_all(${1:items})",
      "db.session.commit()"
    ],
    tags: [ "sqlalchemy", "session", "bulk", "insert" ],
    scope: [ "python" ]
  },
  {
    id: "database:session-delete",
    name: "Delete Database Object",
    prefix: "dbsessiondelete",
    category: "database",
    description: "Mark a model instance for deletion.",
    body: [
      "db.session.delete(${1:item})",
      "db.session.commit()"
    ],
    tags: [ "sqlalchemy", "session", "delete" ],
    scope: [ "python" ]
  },

  // Model definitions
  {
    id: "database:model-basic",
    name: "Basic SQLAlchemy Model",
    prefix: "dbmodel",
    category: "database",
    description: "Define a basic SQLAlchemy model with a primary key and columns.",
    body: [
      "class ${1:Item}(db.Model):",
      "    __tablename__ = '${2:items}'",
      "",
      "    id = db.Column(db.Integer, primary_key=True)",
      "    ${3:name} = db.Column(db.String(${4:120}), nullable=False)",
      "    ${5:description} = db.Column(db.Text, nullable=True)"
    ],
    tags: [ "sqlalchemy", "model", "table" ],
    scope: [ "python" ]
  },
  {
    id: "database:model-timestamps",
    name: "Model With Timestamps",
    prefix: "dbtimestamps",
    category: "database",
    description: "Add automatically managed creation and update timestamps to a model.",
    body: [
      "from datetime import datetime, timezone",
      "",
      "created_at = db.Column(",
      "    db.DateTime(timezone=True),",
      "    default=lambda: datetime.now(timezone.utc),",
      "    nullable=False",
      ")",
      "updated_at = db.Column(",
      "    db.DateTime(timezone=True),",
      "    default=lambda: datetime.now(timezone.utc),",
      "    onupdate=lambda: datetime.now(timezone.utc),",
      "    nullable=False",
      ")"
    ],
    tags: [ "sqlalchemy", "model", "timestamps" ],
    scope: [ "python" ]
  },
  {
    id: "database:model-unique",
    name: "Unique Model Column",
    prefix: "dbunique",
    category: "database",
    description: "Define a column whose values must be unique.",
    body: [
      "${1:email} = db.Column(",
      "    db.String(${2:255}),",
      "    unique=True,",
      "    nullable=False",
      ")"
    ],
    tags: [ "sqlalchemy", "model", "constraint", "unique" ],
    scope: [ "python" ]
  },
  {
    id: "database:model-index",
    name: "Indexed Model Column",
    prefix: "dbindex",
    category: "database",
    description: "Create a database index for a frequently queried column.",
    body: [
      "${1:email} = db.Column(",
      "    db.String(${2:255}),",
      "    index=True,",
      "    nullable=False",
      ")"
    ],
    tags: [ "sqlalchemy", "model", "index" ],
    scope: [ "python" ]
  },
  {
    id: "database:model-default",
    name: "Column With Default Value",
    prefix: "dbdefault",
    category: "database",
    description: "Define a column with a Python-side default value.",
    body: [
      "${1:is_active} = db.Column(",
      "    db.Boolean,",
      "    default=${2:True},",
      "    nullable=False",
      ")"
    ],
    tags: [ "sqlalchemy", "model", "default" ],
    scope: [ "python" ]
  },
  {
    id: "database:model-foreign-key",
    name: "Foreign Key Column",
    prefix: "dbforeignkey",
    category: "database",
    description: "Define a foreign key column referencing another table.",
    body: [
      "${1:user_id} = db.Column(",
      "    db.Integer,",
      "    db.ForeignKey('${2:user.id}'),",
      "    nullable=False",
      ")"
    ],
    tags: [ "sqlalchemy", "model", "foreign-key" ],
    scope: [ "python" ]
  },
  {
    id: "database:model-composite-index",
    name: "Composite Model Index",
    prefix: "dbcompositeindex",
    category: "database",
    description: "Create a composite index across multiple model columns.",
    body: [
      "__table_args__ = (",
      "    db.Index(",
      "        '${1:ix_items_status_created}',",
      "        '${2:status}',",
      "        '${3:created_at}'",
      "    ),",
      ")"
    ],
    tags: [ "sqlalchemy", "model", "index", "composite" ],
    scope: [ "python" ]
  },
  {
    id: "database:model-check-constraint",
    name: "Model Check Constraint",
    prefix: "dbcheckconstraint",
    category: "database",
    description: "Add a database-level check constraint to a model.",
    body: [
      "__table_args__ = (",
      "    db.CheckConstraint(",
      "        '${1:price >= 0}',",
      "        name='${2:check_price_nonnegative}'",
      "    ),",
      ")"
    ],
    tags: [ "sqlalchemy", "model", "constraint" ],
    scope: [ "python" ]
  },
  {
    id: "database:model-enum",
    name: "Enum Model Column",
    prefix: "dbenum",
    category: "database",
    description: "Define a column using a Python enum.",
    body: [
      "import enum",
      "",
      "class ${1:Status}(enum.Enum):",
      "    ${2:PENDING} = '${3:pending}'",
      "    ${4:ACTIVE} = '${5:active}'",
      "    ${6:INACTIVE} = '${7:inactive}'",
      "",
      "${8:status} = db.Column(",
      "    db.Enum(${1:Status}),",
      "    nullable=False,",
      "    default=${1:Status}.${2:PENDING}",
      ")"
    ],
    tags: [ "sqlalchemy", "model", "enum" ],
    scope: [ "python" ]
  },

  // Relationships
  {
    id: "database:relationship-one-to-one",
    name: "One-to-One Relationship",
    prefix: "dbonetoone",
    category: "database",
    description: "Define a one-to-one relationship using uselist=False.",
    body: [
      "class ${1:User}(db.Model):",
      "    id = db.Column(db.Integer, primary_key=True)",
      "    ${2:profile} = db.relationship(",
      "        '${3:Profile}',",
      "        back_populates='${4:user}',",
      "        uselist=False",
      "    )",
      "",
      "class ${3:Profile}(db.Model):",
      "    id = db.Column(db.Integer, primary_key=True)",
      "    ${5:user_id} = db.Column(",
      "        db.Integer,",
      "        db.ForeignKey('${6:user.id}'),",
      "        unique=True",
      "    )",
      "    ${4:user} = db.relationship(",
      "        '${1:User}',",
      "        back_populates='${2:profile}'",
      "    )"
    ],
    tags: [ "sqlalchemy", "relationship", "one-to-one" ],
    scope: [ "python" ]
  },
  {
    id: "database:relationship-backref",
    name: "Relationship With Backref",
    prefix: "dbbackref",
    category: "database",
    description: "Define a relationship that creates a reverse attribute automatically.",
    body: [
      "${1:posts} = db.relationship(",
      "    '${2:Post}',",
      "    backref='${3:author}',",
      "    lazy=True",
      ")"
    ],
    tags: [ "sqlalchemy", "relationship", "backref" ],
    scope: [ "python" ]
  },
  {
    id: "database:relationship-cascade",
    name: "Relationship With Cascade",
    prefix: "dbcascade",
    category: "database",
    description: "Configure cascading operations for related model objects.",
    body: [
      "${1:posts} = db.relationship(",
      "    '${2:Post}',",
      "    back_populates='${3:author}',",
      "    cascade='all, delete-orphan'",
      ")"
    ],
    tags: [ "sqlalchemy", "relationship", "cascade" ],
    scope: [ "python" ]
  },

  // Raw SQL and database utilities
  {
    id: "database:raw-sql",
    name: "Execute Raw SQL",
    prefix: "dbrawsql",
    category: "database",
    description: "Execute a parameterized SQL statement using SQLAlchemy.",
    body: [
      "from sqlalchemy import text",
      "",
      "${1:result} = db.session.execute(",
      "    text('${2:SELECT * FROM items WHERE id = :item_id}'),",
      "    { '${3:item_id}': ${4:item_id} }",
      ")"
    ],
    tags: [ "sqlalchemy", "sql", "execute" ],
    scope: [ "python" ]
  },
  {
    id: "database:raw-sql-fetch",
    name: "Fetch Raw SQL Results",
    prefix: "dbrawfetch",
    category: "database",
    description: "Execute SQL and fetch all returned rows.",
    body: [
      "from sqlalchemy import text",
      "",
      "${1:rows} = db.session.execute(",
      "    text('${2:SELECT * FROM items}')",
      ").mappings().all()"
    ],
    tags: [ "sqlalchemy", "sql", "fetch" ],
    scope: [ "python" ]
  },
  {
    id: "database:create-all",
    name: "Create Database Tables",
    prefix: "dbcreateall",
    category: "database",
    description: "Create all tables registered in SQLAlchemy metadata. Mainly for development and tests.",
    body: [
      "with app.app_context():",
      "    db.create_all()"
    ],
    tags: [ "sqlalchemy", "database", "tables" ],
    scope: [ "python" ]
  },
  {
    id: "database:drop-all",
    name: "Drop All Database Tables",
    prefix: "dbdropall",
    category: "database",
    description: "Drop all registered tables. Destructive operation intended only for disposable development databases.",
    body: [
      "with app.app_context():",
      "    db.drop_all()"
    ],
    tags: [ "sqlalchemy", "database", "tables" ],
    scope: [ "python" ]
  },
  {
    id: "database:database-inspect",
    name: "Inspect Database Tables",
    prefix: "dbinspect",
    category: "database",
    description: "Inspect available database table names using SQLAlchemy's inspector.",
    body: [
      "from sqlalchemy import inspect",
      "",
      "${1:inspector} = inspect(db.engine)",
      "${2:tables} = ${1:inspector}.get_table_names()"
    ],
    tags: [ "sqlalchemy", "database", "inspect" ],
    scope: [ "python" ]
  }
];

export default databaseSnippets;
