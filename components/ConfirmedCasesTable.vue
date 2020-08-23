<template>
  <ul :class="$style.container">
    <li :class="$style.box">
      <div :class="$style.inspections">
        <span> {{ $t('検査実施人数') }} </span>
        <span :class="$style.count">
          <strong>{{ formatNumber(検査実施人数) }}</strong>
          <span :class="$style.unit">{{ $t('人') }}</span>
        </span>
      </div>
    </li>

    <!-- 1階層目（root） -->
    <li
      v-for="(lvA, i) in levelA"
      :key="i"
      :class="[$style.box, $style.parent]"
    >
      <div :class="$style.content">
        <span> {{ lvA.title }} </span>
        <span :class="$style.count">
          <strong>{{ formatNumber(lvA.num) }}</strong>
          <span :class="$style.unit">{{ lvA.unit }}</span>
        </span>
      </div>
      <ul :class="$style.group">
        <!-- 2階層目 -->
        <li
          v-for="(lvB, j) in lvA.items"
          :key="j"
          :class="[$style.box, $style.parent]"
        >
          <div :class="$style.content">
            <span>{{ lvB.title }}</span>
            <span :class="$style.count">
              <strong>{{ formatNumber(lvB.num) }}</strong>
              <span :class="$style.unit">{{ lvB.unit }}</span>
            </span>
          </div>
          <ul :class="$style.group">
            <!-- 3階層目 -->
            <li
              v-for="(lvC, k) in lvB.items"
              :key="k"
              :class="[$style.box, $style.parent]"
            >
              <div :class="$style.content">
                <span>{{ lvC.title }}</span>
                <span :class="$style.count">
                  <strong>{{ formatNumber(lvC.num) }}</strong>
                  <span :class="$style.unit">{{ lvC.unit }}</span>
                </span>
              </div>
              <ul :class="$style.group">
                <!-- 4階層目 -->
                <li
                  v-for="(lvD, l) in lvC.items"
                  :key="l"
                  :class="[$style.box, $style.parent]"
                >
                  <div :class="$style.content">
                    <span>{{ lvD.title }}</span>
                    <span :class="$style.count">
                      <strong>{{ formatNumber(lvD.num) }}</strong>
                      <span :class="$style.unit">{{ lvD.unit }}</span>
                    </span>
                  </div>
                  <ul :class="$style.group">
                    <!-- 5階層目～が必要な場合はここに追加 -->
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</template>

<i18n>
{
  "ja": {
  }
}
</i18n>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component
/* eslint-disable vue/prop-name-casing */
export default class ConfirmedCasedTable extends Vue {
  levelA = [
    {
      title: '陽性者数（累積）',
      num: this['陽性患者数'],
      unit: '人',
      items: [
        {
          title: '現在陽性者数',
          num: this.genzaiNum,
          unit: '人',
          items: [
            {
              title: '入院',
              num: this['入院'],
              unit: '人',
              items: [
                {
                  title: '軽症無症状',
                  num: this.keishoNum,
                  unit: '人',
                  items: []
                },
                {
                  title: '中等症',
                  num: this['中等症'],
                  unit: '人',
                  items: []
                },
                {
                  title: '重症',
                  num: this['重症'],
                  unit: '人',
                  items: []
                }
              ]
            },
            {
              title: '入院調整',
              num: this['入院調整'],
              unit: '人',
              items: []
            },
            {
              title: '施設入所',
              num: this['施設入所'],
              unit: '人',
              items: []
            },
            {
              title: '自宅療養',
              num: this['自宅療養'],
              unit: '人',
              items: []
            },
            {
              title: '調整',
              num: this['調整'],
              unit: '人',
              items: []
            }
          ]
        },
        {
          title: '退院等',
          num: this['退院'],
          unit: '人',
          items: []
        },
        {
          title: '死亡',
          num: this['死亡'],
          unit: '人',
          items: []
        }
      ]
    }
  ]

  @Prop() 更新日時!: string
  @Prop() 検査実施人数!: number | string
  @Prop() 陽性患者数!: number | string
  @Prop() 入院!: number | string
  @Prop() 軽症無症状!: number | string
  @Prop() 中等症!: number | string
  @Prop() 重症!: number | string
  @Prop() 入院調整!: number | string
  @Prop() 施設入所!: number | string
  @Prop() 自宅療養!: number | string
  @Prop() 調整!: number | string
  @Prop() 退院!: number | string
  @Prop() 死亡!: number | string
  @Prop() 入院中!: number | string
  @Prop() 軽症中等症!: number | string
  @Prop() 転院!: number | string
  @Prop() 備考!: string

  get genzaiNum(): number {
    // 「現在陽性者数」＝「入院」+「入院調整」+「施設入所」+「自宅療養」+「調整」
    return (
      (this.toNumber(this['入院']) ?? 0) +
      (this.toNumber(this['入院調整']) ?? 0) +
      (this.toNumber(this['施設入所']) ?? 0) +
      (this.toNumber(this['自宅療養']) ?? 0) +
      (this.toNumber(this['調整']) ?? 0)
    )
  }

  get keishoNum(): number {
    // 「軽症無症状」＝「入院」－「中等症」－「重症」
    return (
      (this.toNumber(this['入院']) ?? 0) -
      (this.toNumber(this['中等症']) ?? 0) -
      (this.toNumber(this['重症']) ?? 0)
    )
  }

  toNumber(value: number | string): number | undefined {
    if (value == null || value === '') {
      return undefined
    }
    return Number(value)
  }

  formatNumber(value: number | string): string {
    if (value == null || value === '') {
      return '-'
    }
    return Number(value).toLocaleString()
  }
}
</script>

<style lang="scss" module>
$default-bdw: 3px;
$default-boxdiff: 35px;
$default-color: #bd3f4c;
$inspections-color: #333333;
// .container > .box > (.group > .box > ...) .pillar > .content
.container {
  width: 100%;
  box-sizing: border-box;
  color: $default-color;
  line-height: 1.35;
  * {
    box-sizing: border-box;
  }
  // override default styles
  padding-left: 0 !important;
  ul {
    padding-left: 0;
  }
}
.group {
  flex: 0 0 auto;
  padding-left: $default-bdw !important;
  border-top: $default-bdw solid $default-color;
  border-left: $default-bdw solid $default-color;
}
.content {
  padding: 5px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border: $default-bdw solid $default-color;
  > span {
    display: block;
    @include font-size(14);
    &:first-child {
      text-align: left;
      margin-top: 1px;
      flex-shrink: 2;
    }
    &:last-child {
      margin-left: 10px;
      text-align: right;
      // white-space: nowrap;
      flex-shrink: 1;
    }
    &:not(:last-child) {
      overflow-wrap: break-word;
    }
  }
  strong {
    @include font-size(16);
  }
  span.unit {
    @include font-size(14);
  }
  span.count {
    white-space: nowrap;
  }
}
.inspections {
  padding: 5px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border: $default-bdw solid $inspections-color;
  color: $inspections-color;
  > span {
    display: block;
    @include font-size(14);
    &:first-child {
      text-align: left;
      margin-top: 1px;
      flex-shrink: 2;
    }
    &:last-child {
      margin-left: 10px;
      text-align: right;
      // white-space: nowrap;
      flex-shrink: 1;
    }
    &:not(:last-child) {
      overflow-wrap: break-word;
    }
  }
  strong {
    @include font-size(16);
  }
  span.unit {
    @include font-size(14);
  }
  span.count {
    white-space: nowrap;
  }
}
.box {
  display: block;
  margin-top: $default-bdw;
  &.parent {
    border-top: $default-bdw solid $default-color;
    border-left: $default-bdw solid $default-color;
    position: relative;
    padding-left: $default-boxdiff - $default-bdw * 2;
    &::after {
      content: '';
      display: block;
      position: absolute;
      left: -1px;
      bottom: 0;
      width: $default-boxdiff - $default-bdw - 2;
      border-bottom: $default-bdw solid $default-color;
    }
    > .content {
      margin-left: -($default-boxdiff - $default-bdw * 2);
      width: calc(100% + #{($default-boxdiff - $default-bdw * 2)});
      border-top: none;
      border-left: none;
      border-bottom: none;
    }
  }
}
@function px2vw($px, $vw: 0) {
  @if $vw > 0 {
    @return ceil($px / $vw * 100000vw) / 1000;
  } @else {
    @return $px * 1px;
  }
}
@mixin override($vw, $bdw, $fz, $boxdiff) {
  .group {
    padding-left: px2vw($bdw, $vw) !important;
    border-top: px2vw($bdw, $vw) solid $default-color;
    border-left: px2vw($bdw, $vw) solid $default-color;
  }
  .content {
    padding: px2vw(5, $vw) px2vw(10, $vw);
    border: px2vw($bdw, $vw) solid $default-color;
    > span {
      @include font-size($fz);
      &:first-child {
        margin-top: px2vw(1, $vw);
      }
      &:last-child {
        margin-left: 10px;
      }
    }
    strong {
      @include font-size($fz + 2);
    }
    span.unit {
      @include font-size($fz);
    }
  }
  .inspections {
    padding: px2vw(5, $vw) px2vw(10, $vw);
    border: px2vw($bdw, $vw) solid $inspections-color;
    > span {
      @include font-size($fz);
      &:first-child {
        margin-top: px2vw(1, $vw);
      }
      &:last-child {
        margin-left: 10px;
      }
    }
    strong {
      @include font-size($fz + 2);
    }
    span.unit {
      @include font-size($fz);
    }
  }
  .box {
    margin-top: px2vw($bdw, $vw);
    &.parent {
      border-top: px2vw($bdw, $vw) solid $default-color;
      border-left: px2vw($bdw, $vw) solid $default-color;
      padding-left: px2vw($boxdiff, $vw) - px2vw($bdw, $vw) * 2;
      &::after {
        width: px2vw($boxdiff - $bdw, $vw);
        border-bottom: px2vw($bdw, $vw) solid $default-color;
      }
      > .content {
        margin-left: -(px2vw($boxdiff, $vw) - px2vw($bdw, $vw) * 2);
        width: calc(100% + #{(px2vw($boxdiff, $vw) - px2vw($bdw, $vw) * 2)});
      }
    }
  }
}
// Vuetify Breakpoints: Large (1264)
@include lessThan(1263) {
  @include override(1263, 3, 14, 35);
}
// Vuetify Breakpoints: Small (960)
@include lessThan(959) {
  @include override(960, 3, 14, 35);
}
// Vuetify Breakpoints: Extra Small (600)
@include lessThan(600) {
  @include override(600, 3, 14, 35);
}
</style>
