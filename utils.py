import sys, os
import ConfigParser
import MySQLdb
import json

import functions as f

root_path = os.path.split(os.path.realpath(__file__))[0] + '/'
config_path = root_path + './config.conf'
config = ConfigParser.ConfigParser()
config.read(config_path)

number_cnt = int(config.get('lottery', 'number_cnt'))
number_min = int(config.get('lottery', 'number_min'))
number_max = int(config.get('lottery', 'number_max'))

inf = float('Inf')

"""
number place should be: 
    small: 0, 1, 2, 3, 4, 5
    big: 6
"""

class Util:
    def __init__(self):
        self.number_cnt = int(config.get('lottery', 'number_cnt'))
        self.number_min = int(config.get('lottery', 'number_min'))
        self.number_max = int(config.get('lottery', 'number_max'))
        self.mysql_host = config.get('database', 'host')
        self.mysql_port = int(config.get('database', 'port'))
        self.mysql_username = config.get('database', 'username')
        self.mysql_password = config.get('database', 'password')
        self.mysql_db = config.get('database', 'db')
        self.long_connect = False
        self.conn_retain_count = 0

    def getConnection(self):
        conn = MySQLdb.connect(
            host = self.mysql_host,
            port = self.mysql_port,
            user = self.mysql_username,
            passwd = self.mysql_password,
            db = self.mysql_db)
        cur = conn.cursor()
        return (conn, cur)

    def closeConnection(self, conn_cur, commit = True):
        conn = conn_cur[0]
        cur = conn_cur[1]
        cur.close()
        if commit: conn.commit()
        conn.close()

    def connect(self):
        if self.conn_retain_count == 0:
            (self.conn, self.cur) = self.getConnection()
        self.conn_retain_count += 1

    def close(self, commit = True):
        if not self.conn_retain_count > 1:
            self.cur.close()
            if commit: self.conn.commit()
            self.conn.close()
        self.conn_retain_count -= 1

    def startTransaction(self):
        if not self.long_connect:
            try:
                self.connect()
            except Exception, e:
                return False
            return True
        else:
            return False

    def endTransaction(self, accept):
        if not self.long_connect:
            try:
                commit = True if accept else False
                self.close(commit)
            except Exception, e:
                return False
            return True
        else:
            return False

    def forceClose(self, accept = False):
        if not self.long_connect:
            select.conn_retain_count = 0
        self.cur.close()
        if accept: self.conn.commit()
        self.conn.close()

    def isValidNumbers(self, numbers):
        if isinstance(numbers, str):
            numbers = [int(i) for i in numbers.split('_')]
        elif not isinstance(numbers, list):
            return False
        if len(numbers) != number_cnt: return False
        for n in numbers:
            if not isinstance(n, int): return False
            if n < number_min or n > number_max: return False
        return True

    def getLottery(self, _id = None, timestamp = None):
        where_clause = None
        if not _id is None: where_clause = "id = {0}".format(_id)
        if not timestamp is None: where_clause = "timestamp = {0}".format(timestamp)
        if where_clause is None: return None
        (conn, cur) = self.getConnection()
        if not cur.execute("SELECT `id`, `time` FROM `lottery` WHERE {0}".format(where_clause)):
            self.closeConnection((conn, cur), False)
            return None
        record = cur.fetchone()
        _id = int(record[0])
        timestamp = int(record[1])
        if not cur.execute("SELECT `number`, `place` FROM `lottery_number` WHERE lottery_id = {0}".format(_id)):
            self.closeConnection((conn, cur), False)
            return None
        numbers = [0 for i in range(0, number_cnt)]
        while True:
            record = cur.fetchone()
            if record is None: break
            number = int(record[0])
            place = int(record[1])
            if place < number_cnt: numbers[place] = number
            else: continue
        if len(numbers) != number_cnt:
            self.closeConnection((conn, cur), False)
            return None
        for n in numbers:
            if (not isinstance(n, int)) or (n < number_min or n > number_max):
                self.closeConnection((conn, cur), False)
                return None
        lottery = LotteryItem(_id, timestamp, numbers)
        self.closeConnection((conn, cur), True)
        return lottery

    def getAllLotteries(self, page_start = None, page_end = None):
        (conn, cur) = self.getConnection()
        page_limit = None
        if (not page_start is None) and (not page_end is None): page_limit = page_end - page_start + 1
        lotteries = []
        if cur.execute('SELECT `id` FROM `lottery` ORDER BY `time` DESC {0}'.format(
                '' if (page_limit is None) else ('LIMIT %d OFFSET %d' % (page_limit, page_start))
                )):
            # self.closeConnection((conn, cur), False)
            # return None
            pass
        while True:
            record = cur.fetchone()
            if record is None: break
            item = self.getLottery(_id = int(record[0]))
            if item is None: continue
            lotteries.append(item)
        self.closeConnection((conn, cur), True)
        return lotteries

    def getLotteryCount(self):
        (conn, cur) = self.getConnection()
        ret = 0
        if cur.execute('SELECT COUNT(1) FROM `lottery`'):
            record = cur.fetchone()
            if record: ret = int(record[0])
        self.closeConnection((conn, cur), True)
        return ret

    def addLottery(self, numbers):
        if not self.isValidNumbers(numbers): 
            return None
        (conn, cur) = self.getConnection()
        timestamp = f.timestamp()
        if cur.execute('INSERT INTO `lottery` (`time`) VALUES ({0})'.format(timestamp)) \
                and cur.execute('SELECT `id` FROM `lottery` WHERE `time` = {0}'.format(timestamp)):
            pass
        else:
            self.closeConnection((conn, cur), False)
            return None
        lottery_id = int(cur.fetchone()[0])
        if not self.updateLottery(lottery_id, numbers):
            self.closeConnection((conn, cur), False)
            return None
        self.closeConnection((conn, cur), True)
        return LotteryItem(lottery_id, timestamp, numbers)
    def deleteLottery(self, _id):
        (conn, cur) = self.getConnection()
        if cur.execute('DELETE FROM `lottery` WHERE `id` = {0}'.format(_id)) \
                and cur.execute('DELETE FROM `lottery_number` WHERE `lottery_id` = {0}'.format(_id)):
            pass
        # else:
        #     self.closeConnection((conn, cur), False)
        #     return False
        self.closeConnection((conn, cur), True)
        return True
    def updateLottery(self, _id, numbers):
        if not self.isValidNumbers(numbers): return False
        (conn, cur) = self.getConnection()
        if not cur.execute('DELETE FROM `lottery_number` WHERE `lottery_id` = {0}'.format(_id)):
            # self.closeConnection((conn, cur), False)
            # return False
            pass
        for i in range(0, len(numbers)):
            if not cur.execute('INSERT INTO `lottery_number` (`lottery_id`, `number`,`place`) VALUES ({0}, {1}, {2})'.format(_id, numbers[i], i)):
                self.closeConnection((conn, cur), False)
                return False
        self.closeConnection((conn, cur), True)
        return True

    def getConfig(self, key):
        configs = {
            "number_min": number_min,
            "number_max": number_max,
            "number_cnt": number_cnt
        }
        if key and key in configs:
            return configs(key)
        else:
            return configs

    def getStatistics(self, time_start = None, time_end = None):
        (conn, cur) = self.getConnection()
        where_clause = '1'
        place_number_times = [[inf for ii in range(number_min, number_max + 1)] for i in range(0,number_cnt)]
        number_place_times = [[inf for ii in range(0,number_cnt)] for i in range(number_min, number_max + 1)]
        number_times = [inf for i in range(number_min, number_max + 1)]
        left_items = (number_max - number_min + 1) * number_cnt
        cur.execute('SELECT `lottery_number`.`number`, `lottery_number`.`place`, `lottery`.`time`, `lottery`.`id` FROM `lottery_number`, `lottery` WHERE `lottery_number`.`lottery_id` = `lottery`.`id` ORDER BY `lottery`.`time` DESC')
        current_time = -1
        current_timestamp = 0
        while True:
            record = cur.fetchone()
            if record is None: break
            number = int(record[0])
            place = int(record[1])
            timestamp = int(record[2])
            if timestamp != current_timestamp:
                current_time += 1
                current_timestamp = timestamp
            if place_number_times[place][number - number_min] == inf:
                place_number_times[place][number - number_min] = current_time
                number_place_times[number - number_min][place] = current_time
                if number_times[number - number_min] == inf: number_times[number - number_min] = current_time
                left_items -= 1
            if left_items == 0: break
        self.closeConnection((conn, cur), True)
        return {
            "number_min": number_min,
            "number_max": number_max,
            "number_cnt": number_cnt,
            "data": place_number_times,
            "data_numbers": number_times
        }


class LotteryItem:
    def __init__(self,
            _id = -1,
            timestamp = 0,
            numbers = [0 for i in range(0,number_cnt)]):
        if isinstance(numbers, str):
            numbers = [int(i) for i in numbers.split('_')]
        elif not isinstance(numbers, list):
            raise Exception("parameter error", "parameter numbers should be a list or string")
        if len(numbers) != number_cnt: raise Exception("parameter error", "length of parameter numbers should be %d" % number_cnt)
        for n in numbers:
            if not isinstance(n, int): raise Exception("parameter error", "item of parameter numbers should be an integer")
            if n < number_min or n > number_max: raise Exception("parameter error", "item of parameter numbers should be between %d to %d" % (number_min, number_max))
        self.id = _id
        self.timestamp = timestamp
        self.numbers = numbers

    def toDict(self):
        return {
            "id": self.id,
            "time": self.timestamp,
            "numbers": self.numbers
        }

    def stringify(self):
        return json.dumps(self.toDict())








