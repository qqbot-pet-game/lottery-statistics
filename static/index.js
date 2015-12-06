DEFAULT_PORT = 8080;

place_cnt = 7;

ps = 0;
pn = 10;
total = pn + 1;

$.fn.disable = function() {
    $(this).attr('disabled', 'disabled');
}
$.fn.enable = function() {
    $(this).removeAttr('disabled');
}

Array.prototype.has = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return true;
    }
    return false;
}

function formatInt(num, digits) {
    var add_num = Math.pow(10, digits);
    return ('' + (add_num + num)).slice(-digits);
}

$(document).ready(function (e) {
    $('#table-collapse').click(function(event) {
        if ($(this).find('i').is('.fa-angle-up')) {
            $(this).find('i').removeClass('fa-angle-up').addClass('fa-angle-down');
            $(this).find('span').text('展开');
            $('#table-container table tr').not(':first-child').hide();
        } else {
            $(this).find('i').removeClass('fa-angle-down').addClass('fa-angle-up');
            $(this).find('span').text('收起');
            $('#table-container table tr').not(':first-child').show();
        }
    });

    $('#lottery-input').on('click', function(event) {
        $('#lottery-input-fake').focus();
        $(this).addClass('active');
        $('#lottery-input-fake').val('');
        $('#lottery-input-fake').keyup();
    });
    $('#lottery-input-fake').on('blur', function(event) {
        $('#lottery-input').removeClass('active');
    });
    $('#lottery-input-fake').keyup(function(event) {
        var inputtext = $(this).val();
        if (inputtext.length > 14) {
            inputtext = inputtext.slice(0,place_cnt*2);
            $(this).val(inputtext);
        }
        for (var i = 0; i < place_cnt; i++) {
            var number = inputtext.slice(i*2, i*2+2);
            $($('#lottery-input .lottery-input-item').get(i)).text(number);
        }
        if (inputtext == "") return true;
    });

    $('#statistic-warning').click(function(event) { loadStatistics(); });
    $('#lotteries-warning').click(function(event) { loadLotteries(); });
    $('#btn-add-lottery').click(function(event) { doAddLottery(); });
    $('#btn-prev').click(function(event) { loadLotteries('prev'); });
    $('#btn-next').click(function(event) { loadLotteries('next'); });
    $('#lottery-list').on('click', '.lottery-delete', function(event) {
        event.preventDefault();
        var item = $(this).closest('.lottery-item').data('item');
        doDeleteLottery(item.id);
    });

    loadLotteries();
    loadStatistics();
});

function showMessage(message, options) {
    options = $.extend(true, {
        'type': null,
        'ack': null,
        'cancel': null
    }, options);
    var $text_area = $('#dialog-info-text');
    $text_area.text(message);
    if (options.type) $text_area.attr('class', type ? 'text-'+type : '');
    $('#dialog-info-cancel').off('click.showMessage');
    $('#dialog-info-ack').off('click.showMessage');
    if (typeof options.cancel == 'function') $('#dialog-info-cancel').on('click.showMessage', options.cancel);
    if (typeof options.ack == 'function') $('#dialog-info-ack').on('click.showMessage', options.ack);
    $('#dialog-information').modal('show');
}
function loadingDialog(doshow, callback) {
    $('#dialog-loading').off('shown.bs.modal');
    $('#dialog-loading').off('hidden.bs.modal');
    if (typeof callback == "function") $('#dialog-loading').one('shown.bs.modal', function() { callback(); $('#dialog-loading').off('hidden.bs.modal');} );
    if (typeof callback == "function") $('#dialog-loading').one('hidden.bs.modal', function() { callback(); $('#dialog-loading').off('shown.bs.modal');} );
    if (doshow === undefined || doshow === null) $('#dialog-loading').modal('toggle');
    else if (doshow) $('#dialog-loading').modal('show');
    else $('#dialog-loading').modal('hide');
}

function formatDate(date, format) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    format = format.replace(/yyyy/g, formatInt(year, 4));
    format = format.replace(/y/g, '' + year);
    format = format.replace(/MM/g, formatInt(month, 2));
    format = format.replace(/M/g, '' + month);
    format = format.replace(/dd/g, formatInt(day, 2));
    format = format.replace(/d/g, '' + day);
    format = format.replace(/hh/g, formatInt(hour, 2));
    format = format.replace(/h/g, '' + hour);
    format = format.replace(/mm/g, formatInt(minute, 2));
    format = format.replace(/m/g, '' + minute);
    format = format.replace(/ss/g, formatInt(second, 2));
    format = format.replace(/s/g, '' + second);
    return format;
}

function createLotteryItem(item) {
    var el = $('<li class="lottery-item">' + 
                    '<div class="lottery-header">' + 
                        '<span class="lottery-date">' + formatDate(new Date(item.time), "yyyy年MM月dd日") + '</span>' + 
                        '<span class="lottery-delete">删除</span>' + 
                    '</div>' + 
                    '<div class="lottery-codes">' + 
                    '</div>' + 
                '</li>');
    for (var i = 0; i < item.numbers.length; i++)
        $('<span class="lottery-code-item ' + ((i % 2) ? 'odd' : 'even') + '"><div class="lottery-code-item-text">' + formatInt(item.numbers[i], 2) + '</div></span>').appendTo(el.find('.lottery-codes'));
    el.data('item', item);
    return el;
}

function deleteLotteryItem(id, successCallbak, failCallback, callback) {
    $.ajax({
        url: '/api/record',
        type: 'POST',
        data: JSON.stringify({ "id": id })
    })
    .done(function(data) {
        if (successCallbak) successCallbak(data);
    })
    .fail(function(error) {
        if (failCallback) failCallback(error);
    })
    .always(function() {
        if (callback) callback();
    });
}
function addLotteryItem(numbers, successCallbak, failCallback, callback) {
    $.ajax({
        url: '/api/record',
        type: 'POST',
        data: JSON.stringify({ "numbers": numbers })
    })
    .done(function(data) {
        if (successCallbak) successCallbak(data);
    })
    .fail(function(error) {
        if (failCallback) failCallback(error);
    })
    .always(function() {
        if (callback) callback();
    });
}
function updateLotteryItem(item, successCallbak, failCallback, callback) {
    $.ajax({
        url: '/api/record',
        type: 'POST',
        data: JSON.stringify({ "id": item.id, "numbers": item.numbers })
    })
    .done(function(data) {
        if (successCallbak) successCallbak(data);
    })
    .fail(function(error) {
        if (failCallback) failCallback(error);
    })
    .always(function() {
        if (callback) callback();
    });
}

function getAllLotteries(ps, pn, successCallbak, failCallback, callback) {
    $.ajax({
        url: '/api/record',
        type: 'GET',
        data: { "pn": pn, "ps": ps }
    })
    .done(function(data) {
        if (successCallbak) successCallbak(data);
    })
    .fail(function(error) {
        if (failCallback) failCallback(error);
    })
    .always(function() {
        if (callback) callback();
    });
}

function getStatistics(successCallbak, failCallback, callback) {
    $.ajax({
        url: '/api/statistics',
        type: 'GET'
    })
    .done(function(data) {
        if (successCallbak) successCallbak(data);
    })
    .fail(function(error) {
        if (failCallback) failCallback(error);
    })
    .always(function() {
        if (callback) callback();
    });
}






function loadStatistics() {
    $('#statistic-warning').hide();
    $('#statistic-container').hide();
    $('#statistic-spinner').show();
    getStatistics(function(data) {
        data = JSON.parse(data);
        table_data = [['数字', '小一', '小二', '小三', '小四', '小五', '小六', '大码', '总计']]
        for (var i = 0; i < data.number_max - data.number_min + 1; i++) {
            var row = [i + data.number_min];
            // for (var j = 0; j < place_cnt; j++) { row.push((data.length > j && data[j].length > i) ? 0 : data.data[j][i]);}
            // row.push((data.data_numbers.length > i) ? 0 : data.data_numbers[i]);
            for (var j = 0; j < place_cnt; j++) { row.push(data.data[j][i]);}
            row.push(data.data_numbers[i]);
            table_data.push(row);
        }
        var colOptions = [{arrangeable: true}, {arrangeable: true}, {arrangeable: true}, {arrangeable: true}, {arrangeable: true}, {arrangeable: true}, {arrangeable: true}, {arrangeable: true}, {arrangeable: true}];
        var table = new Table(table_data, {
            withHeader: true,
            firstHeader: true,
            cls: 'table table-bordered table-hover',
            id: 'data-table',
            colOptions: colOptions
        });
        $('#table-container').children().remove();
        table.tableEl.appendTo('#table-container');
        $('#statistic-warning').hide();
        $('#statistic-container').show();
        $('#statistic-spinner').hide();
    }, function() {
        $('#statistic-warning').show();
        $('#statistic-container').hide();
        $('#statistic-spinner').hide();
    });
}

function loadLotteries(direction) {
    $('#lotteries-warning').hide();
    $('#lotteries-container').hide();
    $('#lotteries-spinner').show();
    var _ps;
    if (direction == 'prev') _ps = Math.max(ps - pn, 0);
    else if (direction == 'next') _ps = Math.min(ps + pn, total);
    else _ps = ps;
    getAllLotteries(_ps, pn, function(data) {
        data = JSON.parse(data);
        if (data.ps <= 0) $('#btn-prev').disable();
        else $('#btn-prev').enable();
        if (((data.ps + 1) * data.pn - 1) >= data.total) $('#btn-next').disable();
        else $('#btn-next').enable();
        total = data.total;
        $('#lottery-list').children().remove();
        for (var i = 0; i < data.data.length; i++) createLotteryItem(data.data[i]).appendTo('#lottery-list');
        $('#lotteries-warning').hide();
        $('#lotteries-container').show();
        $('#lotteries-spinner').hide();
    }, function() {
        $('#lotteries-warning').show();
        $('#lotteries-container').hide();
        $('#lotteries-spinner').hide();
    });
}

function doDeleteLottery(id) {
    loadingDialog(true);
    deleteLotteryItem(id, function() {
        loadingDialog(false);
        showMessage("删除成功");
        loadLotteries();
        loadStatistics();
    }, function() {
        loadingDialog(false);
        showMessage("删除失败");
    });
}

function doAddLottery() {
    var inputtext = $('#lottery-input-fake').val();
    if (inputtext.length != 2 * place_cnt) {
        showMessage("请输入完整的数字！");
        return;
    }
    var numbers = [];
    for (var i = 0; i < place_cnt; i++) {
        var num = parseInt(inputtext.slice(i*2, i*2+2));
        if (isNaN(num)) {
            showMessage("输入数字不合法，请重试");
            return;
        }
        numbers.push(num);
    }
    loadingDialog(true);
    addLotteryItem(numbers, function() {
        loadingDialog(false);
        showMessage("添加成功");
        $('#lottery-input-fake').val('');
        $('#lottery-input-fake').keyup();
        loadLotteries();
        loadStatistics();
    }, function() {
        loadingDialog(false);
        showMessage("添加失败");
    });
}























