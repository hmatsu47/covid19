<template>
  <data-view
    :title="displayTitle"
    title-id="inspection-count-chart"
    :date="date"
    url="https://www.pref.aichi.jp/site/covid19-aichi/kansensya-kensa.html"
    :remarks="remarks"
  >
    <template v-if="showSelector" v-slot:button>
      <data-selector v-model="dataKind" :items="dataKinds" />
    </template>

    <div style="flex-grow: 1; display: flex; align-items: start;">
      <time-bar-line-chart
        chart-id="inspection-count-chart"
        :chart-data="chartData"
        :y-axis-left-setting="yAxisLeftSetting"
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
import dayjs from 'dayjs'
import * as Enumerable from 'linq'
import DataView from '@/components/DataView.vue'
import DataSelector, { SelectorItem } from '@/components/DataSelector.vue'
import DataViewBasicInfoPanel from '@/components/DataViewBasicInfoPanel.vue'
import DateSelectSlider from '@/components/DateSelectSlider.vue'
import TimeBarLineChart, {
  GraphData,
  YAxisSetting
} from '@/components/TimeBarLineChart.vue'
import {
  InspectionsSummaryDaily,
  InspectionsSummaryWeekly
} from '~/utils/types'

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
export default class InspectionCountChart extends Vue {
  @Prop()
  public date?: string

  @Prop()
  public dailyData?: InspectionsSummaryDaily[]

  @Prop()
  public weeklyData?: InspectionsSummaryWeekly[]

  private readonly yAxisLeftSetting: YAxisSetting = {
    min: 0,
    unit: '件',
    visible: true
  } as YAxisSetting

  private readonly remarks = [
    '日別と累計では、日別データが公開されている期間のみ表示',
    '愛知県分（愛知県衛生研究所等）及び保健所設置市分（名古屋市衛生研究所等）の合計',
    '民間施設等の検査件数及び陽性者数を含んでいます（発表時点での把握数）'
  ]

  private readonly showSelector = false
  private dataKind: DataKind = 'daily-transition'
  private readonly dataKinds = [
    // { key: 'weekly-transition', label: '週別' } as SelectorItem,
    { key: 'daily-transition', label: '日別' } as SelectorItem
    // { key: 'daily-cumulative', label: '累計' } as SelectorItem
  ]

  private readonly chartDataSet = new Map<DataKind, GraphData>()

  private get displayTitle(): string {
    return `検査実施件数${
      this.dataKind === 'weekly-transition' ? '(週別)' : ''
    }`
  }

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
    this.chartDataSet.set(
      'weekly-transition',
      this.buildWeeklyTransitionGraphData()
    )
    this.chartDataSet.set(
      'daily-cumulative',
      this.buildDailyCumulativeGraphData()
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

  private buildDailyTransitionGraphData = (): GraphData => {
    const now = dayjs()
    const rows = Enumerable.from(this.dailyData ?? [])
      .where(d => dayjs(d['日付']) < now)
      .select(d => {
        return {
          date: dayjs(d['日付']).format('YYYY-MM-DD'),
          count: Number(d['小計']),
          summarize: d['合算']
        }
      })
      .where(d => !d.summarize)

    return {
      dates: rows.select(d => d.date).toArray(),
      datasets: [
        {
          type: 'bar',
          title: '件数',
          unit: '件',
          values: rows.select(d => d.count).toArray(),
          order: 2
        }
      ]
    } as GraphData
  }

  private buildWeeklyTransitionGraphData = (): GraphData => {
    const now = dayjs()
    const rows = Enumerable.from(this.weeklyData ?? [])
      .where(
        d =>
          dayjs(d['開始日']) < now && dayjs(d['開始日']) >= dayjs('2020-03-02')
      )
      .select(d => {
        return {
          date: [
            dayjs(d['開始日']).format('YYYY-MM-DD'),
            dayjs(d['終了日']).format('YYYY-MM-DD')
          ],
          count: Number(d['小計'])
        }
      })

    return {
      dates: rows.select(d => d.date).toArray(),
      datasets: [
        {
          type: 'bar',
          title: '件数',
          unit: '件',
          values: rows.select(d => d.count).toArray()
        }
      ]
    } as GraphData
  }

  private buildDailyCumulativeGraphData = (): GraphData => {
    let subTotal = 0
    const now = dayjs()
    const arr = (this.dailyData ?? [])
      .filter(d => dayjs(d['日付']) < now)
      .map(d => {
        subTotal += Number(d['小計'])
        return {
          date: dayjs(d['日付']).format('YYYY-MM-DD'),
          total: subTotal,
          summarize: d['合算']
        }
      })

    const rows = Enumerable.from(arr).where(d => !d.summarize)

    return {
      dates: rows.select(d => d.date).toArray(),
      datasets: [
        {
          type: 'bar',
          title: '累計件数',
          unit: '件',
          values: rows.select(d => d.total).toArray()
        }
      ]
    } as GraphData
  }
}
</script>
