Table = function(data, opts) {
	this.options = $.extend({
		withHeader: false,
		firstHeader: false,
		headerData: [],
		cls: "",
		id: null,
		appendTo: null,
		colOptions: [],
		rowOptions: [],
		unitOptions: []
	}, opts);

	this._init = function() {
		this.data = data;
		this.tableEl = $('<table class="table ' + this.options.cls + '"></table>');
		this.tableEl.data('controller', this);
		if (this.options.id) this.tableEl.attr('id', this.options.id);
		this.loadData(this.data);
		if (this.options.appendTo) this.tableEl.appendTo(this.options.appendTo);
	};

	this.loadData = function(_data) {
		this.tableEl.empty();

		if (this.options.withHeader) {
			var header_row = this.options.firstHeader ? _data[0] : this.options.headerData;
			var headerRowEl = $('<tr class="table-row-header"></tr>');
			for (var i = 0; i < header_row.length; i++) {
				var colOptions = $.extend({}, Table.defaultOptions.col, this.options.colOptions[i]);
				$('<th><i class="fa"></i>' + header_row[i] + '</th>')
				.data('table-options', colOptions)
				.data('table-data', header_row[i])
				.on('click', function(event) {
					// Arrange by this colume
					var options = $(this).data('table-options');
					if (options.arrangeable === true) {
						event.preventDefault();
						var _this = $(this).closest('table.table').data('controller');
						var desc = $(this).data('arrange-desc');
						$(this).closest('tr.table-row-header').find('th')
							.removeData('arrange-desc')
							.find('i.fa')
								.removeClass('fa-fw')
								.removeClass('fa-sort-desc')
								.removeClass('fa-sort-asc');
						if (typeof desc !== 'boolean') desc = true;
						desc = !desc;
						$(this).data('arrange-desc', desc);
						if (desc) $(this).find('i.fa').addClass('fa-fw').addClass('fa-sort-desc');
						else $(this).find('i.fa').addClass('fa-fw').addClass('fa-sort-asc');
						_this.arrangeByCol($(this).index(), desc);
						_this.applyFixedUnits();
					}
				})
				.appendTo(headerRowEl);
			}
			headerRowEl.appendTo(this.tableEl);
		}

		for (var i = (this.options.firstHeader ? 1 : 0); i < _data.length; i++) {
			var data_idx = this.options.firstHeader ? i - 1 : i;
			var data_row = _data[i];
			var dataRowEl = $('<tr class="table-row-data"></tr>');
			var unitOptionsForRow = (this.options.unitOptions[i] instanceof Array) ? this.options.unitOptions[i] : [];
			for (var j = 0; j < data_row.length; j++) {
				var data_item = data_row[j];
				var data_text = data_item;
				if (data_text === undefined || data_text === null) data_text = "";
				var unitOptions = $.extend({}, Table.defaultOptions.unit, unitOptionsForRow[j]);
				var tdEl = $('<td>' + data_text + '</td>').data('table-data', data_item).data('table-options', unitOptions);
				if (unitOptions.fixed === true) tdEl.data('table-fixed', {row:data_idx, col:j});
				tdEl.appendTo(dataRowEl);
			}
			var rowOptions = $.extend({}, Table.defaultOptions.row, this.options.rowOptions[data_idx]);
			dataRowEl.data('table-options', rowOptions);
			dataRowEl.appendTo(this.tableEl);
		}
	};

	this.arrangeByCol = function(idx, desc) {
		var dataRows = this.tableEl.find('tr.table-row-data');
		dataRows.sort(function(x, y) {
			if ($($(x).find('td').get(idx)).data('table-data') > $($(y).find('td').get(idx)).data('table-data')) {
				return desc ? -1 : 1;
			} else {
				return desc ? 1 : -1;
			}
		});
		dataRows.detach();
		dataRows.each((function(_this){
			return function(index, el) {
				$(this).appendTo(_this.tableEl);
			}
		})(this));
	};

	this.applyFixedUnits = function() {
		this.tableEl.find('tr.table-row-data td').each(function(index, el) {
			var fixed = $(this).data('table-fixed');
			if ((typeof fixed === "object") && (typeof fixed.row === "number") && (typeof fixed.col === "number")) {
				var curr_row = $(this).closest('table.table').find('tr.table-row-data').index($(this).closest('tr.table-row-data'));
				var curr_col = $(this).index();
				var rowToInsertInto = $($(this).closest('table.table').find('tr.table-row-data').get(fixed.row));
				var tdToSubstitute = rowToInsertInto.find('td').get(fixed.col);
				var tdToInsertBefore = rowToInsertInto.find('td').get(fixed.col+1);
				if (tdToSubstitute !== this) {
					$(tdToSubstitute).insertBefore($(this));
					if (tdToInsertBefore) $(this).insertBefore($(tdToInsertBefore));
					else $(this).appendTo(rowToInsertInto);
				}
			}
		});
	};

	this.clearArrange = function() {
		this.loadData(this.data);
	};

	this.getData = function () {
		var data = [];
		this.tableEl.find('tr.table-row-data,tr.table-row-header').each(function(index, el) {
			var row_data = [];
			$(this).find('td,th').each(function(index, el) {
				row_data.push($(this).data('table-data'));
			});
			data.push(row_data);
		});
		return data;
	};

	this._init();
};

Table.defaultOptions = {
	col: {
		arrangeable: false
	},
	row: {},
	unit: {
		fixed: false
	}
};