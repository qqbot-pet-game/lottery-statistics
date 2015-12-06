import time
import random
import copy
import datetime

def random_judge(rate):
    if rate == 0: return False
    elif rate == 1: return True
    else:
        if random.random() < rate:
            return True
def random_select(rates):
    if isinstance(rates, list):
        if len(rates) == 0: return -1
        idx = 0
        total_rate = 0
        rate_sum = 0
        rand = random.random()
        # if rand == 0: return 0
        # elif rand == 1: return len(rates) - 1
        for r in rates: total_rate += r
        total_rate = float(total_rate)
        for r in rates:
            if r == total_rate: break
            rate_sum += r / total_rate
            if rand < rate_sum: break
            elif (rate_sum == 1) and (rand == 1): break
            idx += 1
        return idx
    elif isinstance(rates, dict):
        key_list = rates.keys()
        if len(key_list) == 0: return None
        total_rate = 0
        rate_sum = 0
        rand = random.random()
        # if rand == 0: return key_list[0]
        # elif rand == 1: return key_list[-1]
        for k,r in rates.items(): total_rate += r
        total_rate = float(total_rate)
        for k,r in rates.items():
            if r == total_rate: return k
            rate_sum += r / total_rate
            if rand < rate_sum: return k
            elif (rate_sum == 1) and (rand == 1): return k
        return None

def random_select_multi(rates, cnt):
    idx_list = []
    rates = copy.copy(rates)
    if isinstance(rates, list):
        if len(rates) < cnt: return None
        while len(idx_list) < cnt:
            idx = random_select(rates)
            if idx is None: return None
            idx_list.append(idx)
            rates[idx] = 0
    elif isinstance(rates, dict):
        key_list = rates.keys()
        if len(key_list) < cnt: return None
        while len(idx_list) < cnt:
            idx = random_select(rates)
            if idx is None: return None
            idx_list.append(idx)
            rates[idx] = 0
    if len(idx_list) != cnt: return None
    else: return idx_list

def timestamp(dt = None):
    if dt is None:
        return int(time.time() * 1000)
    else:
        return int(time.mktime((dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, 0, 0, 0)) * 1000)
def datetime(timestamp = None):
    if timestamp is None:
        return datetime.datetime.now()
    else:
        return datetime.datetime.fromtimestamp(timestamp/1000)