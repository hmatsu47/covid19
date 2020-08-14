<template>
  <data-view
    title="入院患者数"
    title-id="hospitalized-chart"
    :date="date"
    url="https://www.pref.aichi.jp/site/covid19-aichi/"
    :remarks="remarks"
  >
    <template v-if="showSelector" v-slot:button>
      <data-selector v-model="dataKind" :items="dataKinds" />
    </template>

    <div style="flex-grow: 1; display: flex; align-items: start;">
      <time-bar-line-chart
        chart-id="hospitalized-chart"
        :chart-data="chartData"
        legend-order-kind="desc"
      />
    </div>

    <template v-slot:infoPanel>
      <data-view-basic-info-panel
        :l-text="displayInfo.lText"
        :s-text="displayInfo.sText"
        :unit="displayInfo.unit"
      />
    </template>
  </data-view>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import dayjs, { Dayjs } from 'dayjs'
import * as Enumerable from 'linq'
import DataView from '@/components/DataView.vue'
import DataSelector, { SelectorItem } from '@/components/DataSelector.vue'
import DataViewBasicInfoPanel from '@/components/DataViewBasicInfoPanel.vue'
import DateSelectSlider from '@/components/DateSelectSlider.vue'
import TimeBarLineChart, { GraphData } from '@/components/TimeBarLineChart.vue'
import { MainSummaryDataType } from '~/utils/types'

export type HospitalizedAverageType = {
  date: Dayjs
  count: number
  average: number | undefined
}

type DataKind = 'daily-transition' | 'weekly-transition' | 'daily-cumulative'

type DisplayInfo = {
  lText: string
  sText: string
  unit: string
}

@Component({
  components: {
    DataView,
    DataSelector,
    DataViewBasicInfoPanel,
    DateSelectSlider,
    TimeBarLineChart
  }
})
export default class HospitalizedChart extends Vue {
  @Prop()
  public date?: string

  @Prop()
  public dailyData?: MainSummaryDataType[]

  private remarks = [
    '「入院患者数」とは、愛知県が発表した「検査陽性者の状況」のうち、「入院」の人数です',
    '7/27以前の「入院患者数」には、「入院調整」「自宅療養」「調整」が含まれています',
    '愛知県が発表した「検査陽性者の状況」を当サイトで記録・時系列化したものであり、実際の数値とは異なる可能性があります',
    '感染症発生状況が取得できなかった日の値は表示していません',
    '過去7日間の平均は、入院患者数の後方7日移動平均値です'
  ]

  private showSelector = false
  private dataKind: DataKind = 'daily-transition'
  private readonly dataKinds = [
    { key: 'daily-transition', label: '日別' } as SelectorItem
  ]

  private readonly chartDataSet = new Map<DataKind, GraphData>()

  private formatDayBeforeRatio = (dayBeforeRatio: any) => {
    const dayBeforeRatioLocaleString = dayBeforeRatio.toLocaleString()
    const prefix = Math.sign(dayBeforeRatio) === 1 ? '+' : ''
    return `${prefix}${dayBeforeRatioLocaleString}`
  }

  private get displayDiffValue(): string {
    if (this.chartData.datasets[0].values.slice(-2)[0] === undefined) {
      return '-'
    }
    const lastDay = this.chartData.datasets[0].values.slice(-1)[0]
    const lastDayBefore = this.chartData.datasets[0].values.slice(-2)[0]
    return this.formatDayBeforeRatio(lastDay - lastDayBefore)
  }

  private get displayInfo(): DisplayInfo {
    if ((this.chartData?.datasets?.length ?? 0) <= 0) {
      return {
        lText: '-',
        sText: '-',
        unit: ''
      } as DisplayInfo
    }

    const dataset = this.chartData.datasets[0]
    const latestValueText = dataset.values.slice(-1)[0].toLocaleString()
    const diffLabel =
      this.dataKind === 'weekly-transition' ? '前週比' : '前日比'
    const latestDate = this.formatDateLabel(this.chartData.dates.slice(-1)[0])
    return {
      lText: latestValueText,
      sText: `${latestDate} 時点（${diffLabel}：${this.displayDiffValue} ${dataset.unit}）`,
      unit: dataset.unit
    }
  }

  private formatDateLabel = (date: string | string[]): string => {
    return (typeof date === 'string' ? [date] : date)
      .map(d => dayjs(d).format('M/D'))
      .join('～')
  }

  constructor() {
    super()

    this.chartDataSet.set(
      'daily-transition',
      this.buildDailyTransitionGraphData()
    )
  }

  private get chartData(): GraphData {
    const data = this.chartDataSet.get(this.dataKind)
    if (data) {
      return data
    } else {
      return {
        dates: [],
        datasets: []
      } as GraphData
    }
  }

  public static makeAverageHospitals = (
    data: MainSummaryDataType[]
  ): Enumerable.IEnumerable<HospitalizedAverageType> => {
    const toNum = (x: number | string): number | null => {
      if (x == null) {
        return null
      }
      if (x === '') {
        return null
      }

      return Number(x)
    }

    const source = Enumerable.from(data).reverse()
    const startDate = dayjs('2020-03-31')
    return source
      .select(d => d['更新日時'])
      .select((_, index) => source.skip(index).take(7))
      .select(d => {
        const first = d.first()
        const ave =
          startDate <= dayjs(first['更新日時']) && d.count() === 7
            ? d
                .where(
                  d => d['入院'] !== undefined || d['入院中'] !== undefined
                )
                .average(d => toNum(d['入院']) ?? toNum(d['入院中']) ?? 0)
            : undefined

        return {
          date: dayjs(dayjs(first['更新日時']).format('YYYY-MM-DD')), // 時刻を切り落とす
          count: toNum(first['入院']) ?? toNum(first['入院中']) ?? 0,
          average: ave
        }
      })
      .reverse()
  }

  private buildDailyTransitionGraphData = (): GraphData => {
    const now = dayjs()
    const rows = HospitalizedChart.makeAverageHospitals(this.dailyData ?? [])
      .where(d => d.date < now)
      .select(d => {
        return {
          date: d.date.format('YYYY-MM-DD'),
          count: d.count,
          average: d.average
        }
      })

    return {
      dates: rows.select(d => d.date).toArray(),
      datasets: [
        {
          type: 'bar',
          title: '入院患者数',
          unit: '人',
          values: rows.select(d => d.count).toArray(),
          order: 2
        },
        {
          type: 'line',
          title: '過去7日間の平均',
          unit: '人',
          values: rows.select(d => d.average).toArray(),
          order: 1
        }
      ]
    } as GraphData
  }
}
</script>
