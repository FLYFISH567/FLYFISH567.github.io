# 旅行足迹底图

边界和城市中心坐标来自阿里云 DataV GeoAtlas 公开数据，下载日期：2026-10-23。

- 中国省级边界：<https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json>
- 城市中心：由各省 `https://geo.datav.aliyun.com/areas_v3/bound/{省级 adcode}_full.json` 的 `properties.center` 提取。直辖市及港澳台使用省级记录的中心。
- 官方接口示例：<https://help.aliyun.com/zh/datav/datav-atlas/developer-reference/atlas-sdk-introduction>

`china.geo.json` 保留原始边界（包含台湾、海南和南海岛屿及相关线段），构建时生成 SVG，浏览时无外部地图请求。南海区域以独立插图展示。

足迹继续读取 `source/_data/album.yml` 的“旅游 / 旅行”分类，名称例如 `江西-南昌`。`travel-cities.json` 包含 370 个城市及省直管行政区的坐标；相同城市的多次记录合并成一个点。无法唯一匹配的位置会保留文字入口，不会猜测坐标。

不在离线城市表中的具体地点，可以在相册记录中增加 `coordinates: [经度, 纬度]` 来指定地图标点。需要填写地点的公开地理坐标，无需提供私人住址。
