import web
import json
import time
from utils import Util

urls = (
    '/', 'Index',
    '/api/record', 'ApiRecord',
    '/api/statistics', 'ApiStatistics'
)

class Index:
    def GET(self):
        render = web.template.render('templates')
        return render.index()
    def POST(self):
        return web.notfound("page not found")

class ApiRecord:
    def GET(self):
        util = Util()
        inputdata = web.input()
        if hasattr(inputdata, 'id'):
            lottery_id = inputdata.id
            item = util.getLottery(_id = inputdata.id)
            if item: return item.stringify()
            else: return web.notfound("lottery not found")
        else:
            ps = int(inputdata.ps) if hasattr(inputdata, 'ps') else 0
            pn = int(inputdata.pn) if hasattr(inputdata, 'pn') else 10
            pe = ps + pn - 1
            items = util.getAllLotteries(ps, pe)
            lottery_cnt = util.getLotteryCount()
            if not items is None: return '{' + '"data": [{0}], "ps": {1}, "pn": {2}, "total": {3}'.format(", ".join([i.stringify() for i in items]), ps, pn, lottery_cnt) + '}'
            else: return web.notfound("lotteries not found")
    def POST(self):
        util = Util()
        postdata = json.loads(web.data())
        numbers = postdata['numbers'] if ('numbers' in postdata) else None
        if "id" in postdata:
            if not numbers or not util.isValidNumbers(numbers):
                if util.deleteLottery(postdata['id']):
                    return "OK"
                else:
                    return web.internalerror("delete failed")
            elif util.updateLottery(postdata['id'], numbers):
                return "OK"
            else:
                return web.internalerror("update failed")
        else:
            if not numbers or not util.isValidNumbers(numbers):
                return web.internalerror("numbers not valid")
            result = util.addLottery(numbers)
            if result: return result.stringify()
            else: return web.internalerror("add failed")

class ApiStatistics:
    def GET(self):
        util = Util()
        result = util.getStatistics()
        print json.dumps(result)
        if result: return json.dumps(result)
        else: return web.internalerror("")


if __name__ == '__main__':
    app = web.application(urls, globals())
    app.run()