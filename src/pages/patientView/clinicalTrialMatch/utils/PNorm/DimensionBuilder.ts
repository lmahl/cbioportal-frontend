import { RankingDimensionName, RankingDimension } from './RankingDimension';

export class DimensionBuilder {
    private AGE_QUERY_WEIGHT = 0.2;
    private AGE_DOCUMENT_VALUE_TO_WEIGHT = 0.01;
    private AGE_EXPLANATION = 'Patient age is matching';

    private DISTANCE_QUERY_WEIGHT = 0.6;
    private DISTANCE_DOCUMENT_VALUE_TO_WEIGHT = 0.01;
    private DISTANCE_EXPLANATION =
        'Distance from patient to closest study location is ';

    private CONDITION_QUERY_WEIGHT = 0.8;
    private CONDITION_DOCUMENT_VALUE_TO_WEIGHT = 0.01;
    private CONDITION_EXPLANATION = 'OncoTree-Code found in study conditions';

    private QUERY_QUERY_WEIGHT = 1;
    private QUERY_DOCUMENT_VALUE_TO_WEIGHT = 0.01;
    private QUERY_EXPLANATION = 'Found keywords in study: ';

    private SEX_QUERY_WEIGHT = 0.4;
    private SEX_DOCUMENT_VALUE_TO_WEIGHT = 0.01;
    private SEX_EXPLANATION = 'Patient gender is matching';

    public buildRankingDimension(
        name: RankingDimensionName,
        documentValue: number
    ): RankingDimension {
        switch (name) {
            case RankingDimensionName.Age:
                return new RankingDimension(
                    name,
                    this.AGE_QUERY_WEIGHT,
                    documentValue * this.AGE_DOCUMENT_VALUE_TO_WEIGHT,
                    this.AGE_EXPLANATION,
                    documentValue
                );
            case RankingDimensionName.Distance:
                return new RankingDimension(
                    name,
                    this.DISTANCE_QUERY_WEIGHT,
                    documentValue * this.DISTANCE_DOCUMENT_VALUE_TO_WEIGHT,
                    this.DISTANCE_EXPLANATION + documentValue + ' km',
                    documentValue
                );
            case RankingDimensionName.Condition:
                return new RankingDimension(
                    name,
                    this.CONDITION_QUERY_WEIGHT,
                    documentValue * this.CONDITION_DOCUMENT_VALUE_TO_WEIGHT,
                    this.CONDITION_EXPLANATION,
                    documentValue
                );
            case RankingDimensionName.Query:
                return new RankingDimension(
                    name,
                    this.QUERY_QUERY_WEIGHT,
                    documentValue * this.QUERY_DOCUMENT_VALUE_TO_WEIGHT,
                    this.QUERY_EXPLANATION,
                    documentValue
                );
            case RankingDimensionName.Sex:
                return new RankingDimension(
                    name,
                    this.SEX_QUERY_WEIGHT,
                    documentValue * this.SEX_DOCUMENT_VALUE_TO_WEIGHT,
                    this.SEX_EXPLANATION,
                    documentValue
                );
            default:
                return new RankingDimension(
                    RankingDimensionName.None,
                    0,
                    0,
                    '',
                    0
                );
        }
    }

    public buildRankingDimensionForKeywords(
        name: RankingDimensionName,
        additionalStrings: string[]
    ): RankingDimension {
        switch (name) {
            case RankingDimensionName.Query:
                var expl = this.QUERY_EXPLANATION;
                for (var i = 0; i < additionalStrings.length; i++) {
                    expl += additionalStrings[i] += ' ';
                }
                return new RankingDimension(
                    name,
                    this.QUERY_QUERY_WEIGHT,
                    additionalStrings.length *
                        this.QUERY_DOCUMENT_VALUE_TO_WEIGHT,
                    expl,
                    additionalStrings.length
                );
            default:
                return new RankingDimension(
                    RankingDimensionName.None,
                    0,
                    0,
                    '',
                    0
                );
        }
    }
}
