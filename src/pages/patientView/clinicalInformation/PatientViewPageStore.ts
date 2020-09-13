import * as _ from 'lodash';
import {
    ClinicalData,
    MolecularProfile,
    Sample,
    Mutation,
    DiscreteCopyNumberFilter,
    DiscreteCopyNumberData,
    MutationFilter,
    CopyNumberCount,
    ClinicalDataMultiStudyFilter,
    SampleMolecularIdentifier,
    GenePanelData,
    GenePanel,
    ReferenceGenomeGene,
} from '../../../shared/api/generated/CBioPortalAPI';
import client from '../../../shared/api/cbioportalClientInstance';
import internalClient from '../../../shared/api/cbioportalInternalClientInstance';
import { default as CBioPortalAPIInternal } from 'shared/api/generated/CBioPortalAPIInternal';
import { computed, observable, action, runInAction } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import { IGisticData } from 'shared/model/Gistic';
import { labelMobxPromises, cached } from 'mobxpromise';
import MrnaExprRankCache from 'shared/cache/MrnaExprRankCache';
import request from 'superagent';
import DiscreteCNACache from 'shared/cache/DiscreteCNACache';
import {
    getDarwinUrl,
    getDigitalSlideArchiveMetaUrl,
} from '../../../shared/api/urls';
import OncoKbEvidenceCache from 'shared/cache/OncoKbEvidenceCache';
import PubMedCache from 'shared/cache/PubMedCache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import GenomeNexusMyVariantInfoCache from 'shared/cache/GenomeNexusMyVariantInfoCache';
import { IOncoKbData } from 'shared/model/OncoKB';
import { IHotspotIndex, indexHotspotsData } from 'react-mutation-mapper';
import { ICivicVariant, ICivicGene } from 'shared/model/Civic.ts';
import { ClinicalInformationData } from 'shared/model/ClinicalInformation';
import VariantCountCache from 'shared/cache/VariantCountCache';
import CopyNumberCountCache from './CopyNumberCountCache';
import CancerTypeCache from 'shared/cache/CancerTypeCache';
import MutationCountCache from 'shared/cache/MutationCountCache';
import AppConfig from 'appConfig';
import {
    findMolecularProfileIdDiscrete,
    ONCOKB_DEFAULT,
    fetchOncoKbData,
    fetchCnaOncoKbData,
    mergeMutations,
    fetchMyCancerGenomeData,
    fetchMutationalSignatureData,
    fetchMutationalSignatureMetaData,
    fetchCosmicData,
    fetchMutationData,
    fetchDiscreteCNAData,
    generateUniqueSampleKeyToTumorTypeMap,
    findMutationMolecularProfile,
    findUncalledMutationMolecularProfileId,
    mergeMutationsIncludingUncalled,
    fetchGisticData,
    fetchCopyNumberData,
    fetchMutSigData,
    findMrnaRankMolecularProfileId,
    mergeDiscreteCNAData,
    fetchSamplesForPatient,
    fetchClinicalData,
    fetchCopyNumberSegments,
    fetchClinicalDataForPatient,
    makeStudyToCancerTypeMap,
    fetchCivicGenes,
    fetchCnaCivicGenes,
    fetchCivicVariants,
    groupBySampleId,
    findSamplesWithoutCancerTypeClinicalData,
    fetchStudiesForSamplesWithoutCancerTypeClinicalData,
    concatMutationData,
    fetchOncoKbCancerGenes,
    fetchVariantAnnotationsIndexedByGenomicLocation,
    fetchReferenceGenomeGenes,
    fetchGenePanelData,
    fetchGenePanel,
    noGenePanelUsed,
} from 'shared/lib/StoreUtils';
import { fetchHotspotsData } from 'shared/lib/CancerHotspotsUtils';
import {
    CancerGene,
    getBrowserWindow,
    stringListToSet,
    VariantAnnotation,
} from 'cbioportal-frontend-commons';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';
import { getNavCaseIdsCache } from '../../../shared/lib/handleLongUrls';
import {
    fetchTrialsById,
    fetchTrialMatchesUsingPOST,
} from '../../../shared/api/MatchMinerAPI';
import {
    IDetailedTrialMatch,
    ITrial,
    ITrialMatch,
    ITrialQuery,
} from '../../../shared/model/MatchMiner';
import { groupTrialMatchesById } from '../trialMatch/TrialMatchTableUtils';
import { GeneFilterOption } from '../mutation/GeneFilterMenu';
import TumorColumnFormatter from '../mutation/column/TumorColumnFormatter';
import {
    computeGenePanelInformation,
    CoverageInformation,
} from '../../resultsView/ResultsViewPageStoreUtils';
import { getVariantAlleleFrequency } from '../../../shared/lib/MutationUtils';
import { AppStore, SiteError } from 'AppStore';
import { getGeneFilterDefault } from './PatientViewPageStoreUtil';
import { checkNonProfiledGenesExist } from '../PatientViewPageUtils';
import {
    StudyListEntry,
    StudyList,
} from '../clinicalTrialMatch/utils/StudyList';
import {
    Study,
    ClinicalTrialsGovStudies,
    Location,
    LocationList,
    Intervention,
    InterventionList,
    EligibilityModule,
} from 'shared/api/ClinicalTrialsGovStudyStrucutre';
import { IDetailedClinicalTrialMatch } from '../clinicalTrialMatch/ClinicalTrialMatchTable';
import {
    searchStudiesForKeywordAsString,
    getStudiesByCondtionsFromOncoKB,
    IOncoKBStudyDictionary,
    getAllStudyNctIdsByOncoTreeCode,
    getAllStudyNctIdsByOncoTreeCodes,
} from 'shared/api/ClinicalTrialMatchAPI';
import { RecruitingStatus } from 'shared/enums/ClinicalTrialsGovRecruitingStatus';
import { ageAsNumber } from '../clinicalTrialMatch/utils/AgeSexConverter';

type PageMode = 'patient' | 'sample';

export async function checkForTissueImage(patientId: string): Promise<boolean> {
    if (/TCGA/.test(patientId) === false) {
        return false;
    } else {
        let resp = await request.get(getDigitalSlideArchiveMetaUrl(patientId));

        // if the count is greater than 0, there is a slide for this patient
        return resp.body && resp.body.total_count && resp.body.total_count > 0;
    }
}

export type PathologyReportPDF = {
    name: string;
    url: string;
};

export function parseCohortIds(concatenatedIds: string) {
    return concatenatedIds.split(',').map((entityId: string) => {
        return entityId.includes(':')
            ? entityId
            : this.studyId + ':' + entityId;
    });
}

export function handlePathologyReportCheckResponse(
    patientId: string,
    resp: any
): PathologyReportPDF[] {
    if (resp.total_count > 0) {
        // only use pdfs starting with the patient id to prevent mismatches
        const r = new RegExp('^' + patientId);
        const filteredItems: any = _.filter(resp.items, (item: any) =>
            r.test(item.name)
        );
        return _.map(filteredItems, (item: any) => ({
            url: item.url,
            name: item.name,
        }));
    } else {
        return [];
    }
}

export function filterMutationsByProfiledGene(
    mutationRows: Mutation[][],
    sampleIds: string[],
    sampleToGenePanelId: { [sampleId: string]: string },
    genePanelIdToEntrezGeneIds: { [sampleId: string]: number[] }
): Mutation[][] {
    return _.filter(mutationRows, (mutations: Mutation[]) => {
        const entrezGeneId = mutations[0].gene.entrezGeneId;
        const geneProfiledInSamples = TumorColumnFormatter.getProfiledSamplesForGene(
            entrezGeneId,
            sampleIds,
            sampleToGenePanelId,
            genePanelIdToEntrezGeneIds
        );
        return (
            _(geneProfiledInSamples)
                .values()
                .filter((profiled: boolean) => profiled)
                .value().length === sampleIds.length
        );
    });
}

/*
 * Transform clinical data from API to clinical data shape as it will be stored
 * in the store
 */
function transformClinicalInformationToStoreShape(
    patientId: string,
    studyId: string,
    sampleIds: Array<string>,
    clinicalDataPatient: Array<ClinicalData>,
    clinicalDataSample: Array<ClinicalData>
): ClinicalInformationData {
    const patient = {
        id: patientId,
        clinicalData: clinicalDataPatient,
    };
    const samples = groupBySampleId(sampleIds, clinicalDataSample);
    const rv = {
        patient,
        samples,
    };

    return rv;
}

class ClinicalTrialsSearchParams {
    clinicalTrialsCountires: string[] = [];
    clinicalTrialsRecruitingStatus: RecruitingStatus[] = [];
    symbolsToSearch: string[] = [];
    necSymbolsToSearch: string[] = [];
    gender: string;
    patientLocation: string;
    age: number;

    constructor(
        clinicalTrialsCountires: string[],
        clinicalTrialsRecruitingStatus: RecruitingStatus[],
        symbolsToSearch: string[] = [],
        necSymbolsToSearch: string[] = [],
        gender: string,
        patientLocation: string,
        age: number
    ) {
        this.clinicalTrialsRecruitingStatus = clinicalTrialsRecruitingStatus;
        this.clinicalTrialsCountires = clinicalTrialsCountires;
        this.symbolsToSearch = symbolsToSearch;
        this.necSymbolsToSearch = necSymbolsToSearch;
        this.gender = gender;
        this.patientLocation = patientLocation;
        this.age = age;
    }
}

export class PatientViewPageStore {
    constructor(private appStore: AppStore) {
        labelMobxPromises(this);
        this.internalClient = internalClient;
    }

    public internalClient: CBioPortalAPIInternal;

    @observable
    public isClinicalTrialsLoading: boolean = false;

    @observable
    private clinicalTrialSerchParams: ClinicalTrialsSearchParams = new ClinicalTrialsSearchParams(
        [],
        [],
        [],
        [],
        '',
        '',
        0
    );

    @observable public activeTabId = '';

    @observable private _patientId = '';
    @computed get patientId(): string {
        if (this._patientId) return this._patientId;

        return this.derivedPatientId.result;
    }

    @observable public urlValidationError: string | null = null;

    @observable ajaxErrors: Error[] = [];

    @observable studyId = '';

    @observable _sampleId = '';

    @observable
    public mutationTableGeneFilterOption: GeneFilterOption = getGeneFilterDefault(
        getBrowserWindow().frontendConfig
    );
    @observable
    public copyNumberTableGeneFilterOption: GeneFilterOption = getGeneFilterDefault(
        getBrowserWindow().frontendConfig
    );

    @computed get sampleId() {
        return this._sampleId;
    }

    @computed get pageTitle(): string {
        if (this.pageMode === 'patient') {
            return `Patient: ${this.patientId}`;
        } else {
            return `Sample: ${this.sampleId}`;
        }
    }

    @computed get metaDescription(): string {
        const id = this.pageMode === 'patient' ? this.patientId : this.sampleId;
        return `${id} from ${this.studyMetaData.result!.name}`;
    }

    @computed get pageMode(): PageMode {
        return this._sampleId ? 'sample' : 'patient';
    }

    @computed get caseId(): string {
        return this.pageMode === 'sample' ? this.sampleId : this.patientId;
    }

    readonly mutationMolecularProfile = remoteData({
        await: () => [this.molecularProfilesInStudy],
        invoke: async () =>
            findMutationMolecularProfile(
                this.molecularProfilesInStudy,
                this.studyId
            ),
    });

    readonly mutationMolecularProfileId = remoteData({
        await: () => [this.molecularProfilesInStudy],
        invoke: async () => {
            const profile = findMutationMolecularProfile(
                this.molecularProfilesInStudy,
                this.studyId
            );
            if (profile) {
                return profile.molecularProfileId;
            } else {
                return undefined;
            }
        },
    });

    readonly uncalledMutationMolecularProfileId = remoteData({
        await: () => [this.molecularProfilesInStudy],
        invoke: async () =>
            findUncalledMutationMolecularProfileId(
                this.molecularProfilesInStudy,
                this.studyId
            ),
    });

    // this is a string of concatenated ids
    @observable
    private _patientIdsInCohort: string[] = [];

    public set patientIdsInCohort(cohortIds: string[]) {
        // cannot put action on setter
        runInAction(() => (this._patientIdsInCohort = cohortIds));
    }

    @computed
    public get patientIdsInCohort(): string[] {
        let concatenatedIds: string;
        // check to see if we copied from url hash on app load
        const memoryCachedIds = getNavCaseIdsCache();
        return memoryCachedIds ? memoryCachedIds : this._patientIdsInCohort;
    }

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    readonly mutationalSignatureData = remoteData({
        invoke: async () => fetchMutationalSignatureData(),
    });

    readonly mutationalSignatureMetaData = remoteData({
        invoke: async () => fetchMutationalSignatureMetaData(),
    });

    readonly hasMutationalSignatureData = remoteData({
        invoke: async () => false,
        default: false,
    });

    readonly derivedPatientId = remoteData<string>({
        await: () => [this.samples],
        invoke: async () => {
            for (let sample of this.samples.result) return sample.patientId;
            return '';
        },
        default: '',
    });

    readonly clinicalDataPatient = remoteData({
        await: () =>
            this.pageMode === 'patient' ? [] : [this.derivedPatientId],
        invoke: async () =>
            fetchClinicalDataForPatient(this.studyId, this.patientId),
        default: [],
    });

    readonly samples = remoteData(
        {
            invoke: () =>
                fetchSamplesForPatient(
                    this.studyId,
                    this._patientId,
                    this.sampleId
                ),
            onError: (err: Error) => {
                this.appStore.siteErrors.push({
                    errorObj: err,
                    dismissed: false,
                    title: 'Samples / Patients not valid',
                } as SiteError);
            },
        },
        []
    );

    // use this when pageMode === 'sample' to get total nr of samples for the
    // patient
    readonly allSamplesForPatient = remoteData({
        await: () => [this.derivedPatientId],
        invoke: async () => {
            return await client.getAllSamplesOfPatientInStudyUsingGET({
                studyId: this.studyId,
                patientId: this.derivedPatientId.result,
                projection: 'DETAILED',
            });
        },
        default: [],
    });

    readonly samplesWithoutCancerTypeClinicalData = remoteData(
        {
            await: () => [this.samples, this.clinicalDataForSamples],
            invoke: async () =>
                findSamplesWithoutCancerTypeClinicalData(
                    this.samples,
                    this.clinicalDataForSamples
                ),
        },
        []
    );

    readonly studiesForSamplesWithoutCancerTypeClinicalData = remoteData(
        {
            await: () => [this.samplesWithoutCancerTypeClinicalData],
            invoke: async () =>
                fetchStudiesForSamplesWithoutCancerTypeClinicalData(
                    this.samplesWithoutCancerTypeClinicalData
                ),
        },
        []
    );

    readonly studies = remoteData(
        {
            invoke: async () => [
                await client.getStudyUsingGET({ studyId: this.studyId }),
            ],
        },
        []
    );

    readonly studyIdToStudy = remoteData(
        {
            await: () => [this.studies],
            invoke: () =>
                Promise.resolve(_.keyBy(this.studies.result, x => x.studyId)),
        },
        {}
    );

    @computed get studyToCancerType() {
        return makeStudyToCancerTypeMap(this.studies.result);
    }

    readonly cnaSegments = remoteData(
        {
            await: () => [this.samples],
            invoke: () => fetchCopyNumberSegments(this.studyId, this.sampleIds),
        },
        []
    );

    readonly pathologyReport = remoteData(
        {
            await: () => [this.derivedPatientId],
            invoke: () => {
                // only check path report for tcga studies
                if (this.studyId.toLowerCase().indexOf('tcga') > -1) {
                    const pathLinkUrl =
                        'https://raw.githubusercontent.com/inodb/datahub/a0d36d77b242e32cda3175127de73805b028f595/tcga/pathology_reports/symlink_by_patient';
                    const rawPdfUrl =
                        'https://github.com/inodb/datahub/raw/a0d36d77b242e32cda3175127de73805b028f595/tcga/pathology_reports';
                    const reports: PathologyReportPDF[] = [];

                    // keep checking if patient has more reports recursively
                    function getPathologyReport(
                        patientId: string,
                        i: number
                    ): any {
                        return request
                            .get(`${pathLinkUrl}/${patientId}.${i}`)
                            .then(
                                function(resp) {
                                    // add report
                                    let pdfName: string = resp.text.split(
                                        '/'
                                    )[1];
                                    reports.push({
                                        name: `${pdfName}`,
                                        url: `${rawPdfUrl}/${pdfName}`,
                                    });
                                    // check if patient has more reports
                                    return getPathologyReport(patientId, i + 1);
                                },
                                () => reports
                            );
                    }

                    return getPathologyReport(this.patientId, 0);
                } else {
                    return Promise.resolve([]);
                }
            },
            onError: (err: Error) => {
                // fail silently
            },
        },
        []
    );

    readonly cosmicData = remoteData({
        await: () => [this.mutationData, this.uncalledMutationData],
        invoke: () =>
            fetchCosmicData(this.mutationData, this.uncalledMutationData),
    });

    readonly mutSigData = remoteData({
        invoke: async () => fetchMutSigData(this.studyId),
    });

    // Mutation annotation
    // genome nexus
    readonly indexedVariantAnnotations = remoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >(
        {
            await: () => [this.mutationData, this.uncalledMutationData],
            invoke: async () =>
                await fetchVariantAnnotationsIndexedByGenomicLocation(
                    concatMutationData(
                        this.mutationData,
                        this.uncalledMutationData
                    ),
                    ['annotation_summary', 'hotspots'],
                    AppConfig.serverConfig.isoformOverrideSource
                ),
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        undefined
    );

    readonly hotspotData = remoteData({
        await: () => [this.mutationData, this.uncalledMutationData],
        invoke: async () => {
            return fetchHotspotsData(
                this.mutationData,
                this.uncalledMutationData
            );
        },
        onError: () => {
            // fail silently
        },
    });

    readonly clinicalDataForSamples = remoteData(
        {
            await: () => [this.samples],
            invoke: () => {
                const identifiers = this.sampleIds.map((sampleId: string) => ({
                    entityId: sampleId,
                    studyId: this.studyId,
                }));
                const clinicalDataMultiStudyFilter = {
                    identifiers,
                } as ClinicalDataMultiStudyFilter;
                return fetchClinicalData(clinicalDataMultiStudyFilter);
            },
        },
        []
    );

    readonly clinicalDataGroupedBySample = remoteData(
        {
            await: () => [this.clinicalDataForSamples],
            invoke: async () =>
                groupBySampleId(
                    this.sampleIds,
                    this.clinicalDataForSamples.result
                ),
        },
        []
    );

    readonly getWholeSlideViewerIds = remoteData({
        await: () => [this.clinicalDataGroupedBySample],
        invoke: () => {
            const clinicalData = this.clinicalDataGroupedBySample.result!;
            const clinicalAttributeId = 'MSK_SLIDE_ID';
            if (clinicalData) {
                const ids = _.chain(clinicalData)
                    .map(data => data.clinicalData)
                    .flatten()
                    .filter(attribute => {
                        return (
                            attribute.clinicalAttributeId ===
                            clinicalAttributeId
                        );
                    })
                    .map(attribute => attribute.value)
                    .value();

                return Promise.resolve(ids);
            }
            return Promise.resolve([]);
        },
    });

    readonly studyMetaData = remoteData({
        invoke: async () => client.getStudyUsingGET({ studyId: this.studyId }),
    });

    readonly patientViewData = remoteData<ClinicalInformationData>(
        {
            await: () => [
                this.clinicalDataPatient,
                this.clinicalDataForSamples,
            ],
            invoke: async () =>
                transformClinicalInformationToStoreShape(
                    this.patientId,
                    this.studyId,
                    this.sampleIds,
                    this.clinicalDataPatient.result,
                    this.clinicalDataForSamples.result
                ),
        },
        {}
    );

    readonly sequencedSampleIdsInStudy = remoteData(
        {
            invoke: async () => {
                return stringListToSet(
                    await client.getAllSampleIdsInSampleListUsingGET({
                        sampleListId: `${this.studyId}_sequenced`,
                    })
                );
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        {}
    );

    readonly molecularProfilesInStudy = remoteData(() => {
        return client.getAllMolecularProfilesInStudyUsingGET({
            studyId: this.studyId,
        });
    }, []);

    readonly molecularProfileIdToMolecularProfile = remoteData<{
        [molecularProfileId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.molecularProfilesInStudy],
            invoke: () => {
                return Promise.resolve(
                    this.molecularProfilesInStudy.result.reduce(
                        (
                            map: {
                                [molecularProfileId: string]: MolecularProfile;
                            },
                            next: MolecularProfile
                        ) => {
                            map[next.molecularProfileId] = next;
                            return map;
                        },
                        {}
                    )
                );
            },
        },
        {}
    );

    readonly referenceGenes = remoteData<ReferenceGenomeGene[]>({
        await: () => [this.studies, this.discreteCNAData],
        invoke: async () => {
            return fetchReferenceGenomeGenes(
                this.studies.result[0].referenceGenome,
                this.discreteCNAData.result.map((d: DiscreteCopyNumberData) =>
                    d.gene.hugoGeneSymbol.toUpperCase()
                )
            );
        },
        onError: err => {
            // throwing this allows sentry to report it
            throw err;
        },
    });

    public readonly mrnaRankMolecularProfileId = remoteData(
        {
            await: () => [this.molecularProfilesInStudy],
            invoke: async () =>
                findMrnaRankMolecularProfileId(this.molecularProfilesInStudy),
        },
        null
    );

    readonly discreteCNAData = remoteData(
        {
            await: () => [this.molecularProfileIdDiscrete, this.samples],
            invoke: async () => {
                const filter = {
                    sampleIds: this.sampleIds,
                } as DiscreteCopyNumberFilter;
                return fetchDiscreteCNAData(
                    filter,
                    this.molecularProfileIdDiscrete
                );
            },
            onResult: (result: DiscreteCopyNumberData[]) => {
                // We want to take advantage of this loaded data, and not redownload the same data
                //  for users of the cache
                this.discreteCNACache.addData(result);
            },
        },
        []
    );

    @computed get mergedDiscreteCNAData(): DiscreteCopyNumberData[][] {
        return mergeDiscreteCNAData(this.discreteCNAData);
    }

    readonly gisticData = remoteData<IGisticData>(
        {
            invoke: async () => fetchGisticData(this.studyId),
        },
        {}
    );

    readonly clinicalEvents = remoteData(
        {
            await: () => [this.patientViewData],
            invoke: async () => {
                return await client.getAllClinicalEventsOfPatientInStudyUsingGET(
                    {
                        studyId: this.studyId,
                        patientId: this.patientId,
                        projection: 'DETAILED',
                    }
                );
            },
        },
        []
    );

    readonly molecularProfileIdDiscrete = remoteData({
        await: () => [this.molecularProfilesInStudy],
        invoke: async () => {
            return findMolecularProfileIdDiscrete(
                this.molecularProfilesInStudy
            );
        },
    });

    readonly studyToMolecularProfileDiscrete = remoteData(
        {
            await: () => [this.molecularProfileIdDiscrete],
            invoke: async () => {
                // we just need it in this form for input to DiscreteCNACache
                const ret: { [studyId: string]: MolecularProfile } = {};
                if (this.molecularProfileIdDiscrete.result) {
                    ret[
                        this.studyId
                    ] = await client.getMolecularProfileUsingGET({
                        molecularProfileId: this.molecularProfileIdDiscrete
                            .result,
                    });
                }
                return ret;
            },
        },
        {}
    );

    readonly darwinUrl = remoteData({
        await: () => [this.derivedPatientId],
        invoke: async () => {
            if (AppConfig.serverConfig.enable_darwin === true) {
                let resp = await request.get(
                    getDarwinUrl(this.sampleIds, this.patientId)
                );
                return resp.text;
            } else {
                return '';
            }
        },
        onError: () => {
            // fail silently
        },
    });

    readonly hasTissueImageIFrameUrl = remoteData(
        {
            await: () => [this.derivedPatientId],
            invoke: async () => {
                return checkForTissueImage(this.patientId);
            },
            onError: () => {
                // fail silently
            },
        },
        false
    );

    readonly uncalledMutationData = remoteData(
        {
            await: () => [
                this.samples,
                this.uncalledMutationMolecularProfileId,
            ],
            invoke: async () => {
                const mutationFilter = {
                    sampleIds: this.samples.result.map(
                        (sample: Sample) => sample.sampleId
                    ),
                } as MutationFilter;

                return fetchMutationData(
                    mutationFilter,
                    this.uncalledMutationMolecularProfileId.result
                );
            },
        },
        []
    );

    readonly coverageInformation = remoteData<CoverageInformation>(
        {
            await: () => [
                this.mutatedGenes,
                this.samples,
                this.molecularProfilesInStudy,
            ],
            invoke: async () => {
                // gather sample molecular identifiers
                const sampleMolecularIdentifiers: SampleMolecularIdentifier[] = [];
                this.samples.result!.forEach(sample => {
                    const profiles = this.molecularProfilesInStudy.result!;
                    if (profiles) {
                        const sampleId = sample.sampleId;
                        for (const profile of profiles) {
                            sampleMolecularIdentifiers.push({
                                molecularProfileId: profile.molecularProfileId,
                                sampleId,
                            });
                        }
                    }
                });
                // query for gene panel data using sample molecular identifiers
                let genePanelData: GenePanelData[];
                if (
                    sampleMolecularIdentifiers.length &&
                    this.mutatedGenes.result!.length
                ) {
                    genePanelData = await client.fetchGenePanelDataInMultipleMolecularProfilesUsingPOST(
                        {
                            sampleMolecularIdentifiers,
                        }
                    );
                } else {
                    genePanelData = [];
                }

                // query for gene panel metadata
                const genePanelIds = _.uniq(
                    genePanelData
                        .map(gpData => gpData.genePanelId)
                        .filter(id => !!id)
                );
                let genePanels: GenePanel[] = [];
                if (genePanelIds.length) {
                    genePanels = await client.fetchGenePanelsUsingPOST({
                        genePanelIds,
                        projection: 'DETAILED',
                    });
                }

                // plug all data into computeGenePanelInformation to generate coverageInformation object
                return computeGenePanelInformation(
                    genePanelData,
                    genePanels,
                    this.samples.result!,
                    [
                        {
                            uniquePatientKey: this.samples.result![0]
                                .uniquePatientKey,
                        },
                    ],
                    this.mutatedGenes.result!
                );
            },
        },
        { samples: {}, patients: {} }
    );

    readonly mutationData = remoteData(
        {
            await: () => [this.samples, this.mutationMolecularProfileId],
            invoke: async () => {
                const mutationFilter = {
                    sampleIds: this.sampleIds,
                } as MutationFilter;

                return fetchMutationData(
                    mutationFilter,
                    this.mutationMolecularProfileId.result
                );
            },
        },
        []
    );

    readonly mutatedGenes = remoteData({
        await: () => [this.mutationData],
        invoke: () => {
            return Promise.resolve(
                _.uniqBy(this.mutationData.result!, d => d.entrezGeneId).map(
                    m => ({
                        hugoGeneSymbol: m.gene.hugoGeneSymbol,
                        entrezGeneId: m.entrezGeneId,
                    })
                )
            );
        },
    });

    readonly oncoKbCancerGenes = remoteData(
        {
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchOncoKbCancerGenes();
                } else {
                    return Promise.resolve([]);
                }
            },
        },
        []
    );

    readonly oncoKbAnnotatedGenes = remoteData(
        {
            await: () => [this.oncoKbCancerGenes],
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return Promise.resolve(
                        _.reduce(
                            this.oncoKbCancerGenes.result,
                            (
                                map: { [entrezGeneId: number]: boolean },
                                next: CancerGene
                            ) => {
                                if (next.oncokbAnnotated) {
                                    map[next.entrezGeneId] = true;
                                }
                                return map;
                            },
                            {}
                        )
                    );
                } else {
                    return Promise.resolve({});
                }
            },
        },
        {}
    );

    readonly oncoKbData = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.oncoKbAnnotatedGenes,
                this.mutationData,
                this.uncalledMutationData,
                this.clinicalDataForSamples,
                this.studiesForSamplesWithoutCancerTypeClinicalData,
                this.studies,
            ],
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchOncoKbData(
                        this.uniqueSampleKeyToTumorType,
                        this.oncoKbAnnotatedGenes.result || {},
                        this.mutationData,
                        undefined,
                        this.uncalledMutationData
                    );
                } else {
                    return Promise.resolve({
                        indicatorMap: null,
                        uniqueSampleKeyToTumorType: null,
                    });
                }
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    readonly civicGenes = remoteData<ICivicGene | undefined>(
        {
            await: () => [
                this.mutationData,
                this.uncalledMutationData,
                this.clinicalDataForSamples,
            ],
            invoke: async () =>
                AppConfig.serverConfig.show_civic
                    ? fetchCivicGenes(
                          this.mutationData,
                          this.uncalledMutationData
                      )
                    : {},
            onError: (err: Error) => {
                // fail silently
            },
        },
        undefined
    );

    readonly civicVariants = remoteData<ICivicVariant | undefined>(
        {
            await: () => [
                this.civicGenes,
                this.mutationData,
                this.uncalledMutationData,
            ],
            invoke: async () => {
                if (
                    AppConfig.serverConfig.show_civic &&
                    this.civicGenes.result
                ) {
                    return fetchCivicVariants(
                        this.civicGenes.result as ICivicGene,
                        this.mutationData,
                        this.uncalledMutationData
                    );
                } else {
                    return {};
                }
            },
            onError: (err: Error) => {
                // fail silently
            },
        },
        undefined
    );

    readonly cnaOncoKbData = remoteData<IOncoKbData>(
        {
            await: () => [
                this.oncoKbAnnotatedGenes,
                this.discreteCNAData,
                this.clinicalDataForSamples,
                this.studies,
            ],
            invoke: async () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchCnaOncoKbData(
                        this.uniqueSampleKeyToTumorType,
                        this.oncoKbAnnotatedGenes.result || {},
                        this.discreteCNAData
                    );
                } else {
                    return ONCOKB_DEFAULT;
                }
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    readonly cnaCivicGenes = remoteData<ICivicGene | undefined>(
        {
            await: () => [this.discreteCNAData, this.clinicalDataForSamples],
            invoke: async () =>
                AppConfig.serverConfig.show_civic
                    ? fetchCnaCivicGenes(this.discreteCNAData)
                    : {},
            onError: (err: Error) => {
                // fail silently
            },
        },
        undefined
    );

    readonly cnaCivicVariants = remoteData<ICivicVariant | undefined>(
        {
            await: () => [this.civicGenes, this.mutationData],
            invoke: async () => {
                if (this.cnaCivicGenes.status == 'complete') {
                    return fetchCivicVariants(this.cnaCivicGenes
                        .result as ICivicGene);
                }
            },
            onError: (err: Error) => {
                // fail silently
            },
        },
        undefined
    );

    readonly copyNumberCountData = remoteData<CopyNumberCount[]>(
        {
            await: () => [this.discreteCNAData],
            invoke: async () =>
                fetchCopyNumberData(
                    this.discreteCNAData,
                    this.molecularProfileIdDiscrete
                ),
        },
        []
    );

    @computed get sampleIds(): string[] {
        if (this.samples.result) {
            return this.samples.result.map(sample => sample.sampleId);
        }

        return [];
    }

    readonly indexedHotspotData = remoteData<IHotspotIndex | undefined>({
        await: () => [this.hotspotData],
        invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData)),
    });

    readonly sampleToMutationGenePanelData = remoteData<{
        [sampleId: string]: GenePanelData;
    }>(
        {
            await: () => [this.mutationMolecularProfileId],
            invoke: async () => {
                if (this.mutationMolecularProfileId.result) {
                    return fetchGenePanelData(
                        this.mutationMolecularProfileId.result,
                        this.sampleIds
                    );
                }
                return {};
            },
        },
        {}
    );

    readonly sampleToMutationGenePanelId = remoteData<{
        [sampleId: string]: string;
    }>(
        {
            await: () => [this.sampleToMutationGenePanelData],
            invoke: async () => {
                return _.mapValues(
                    this.sampleToMutationGenePanelData.result,
                    genePanelData => genePanelData.genePanelId
                );
            },
        },
        {}
    );

    readonly sampleToDiscreteGenePanelData = remoteData<{
        [sampleId: string]: GenePanelData;
    }>(
        {
            await: () => [this.molecularProfileIdDiscrete],
            invoke: async () => {
                if (this.molecularProfileIdDiscrete.result) {
                    return fetchGenePanelData(
                        this.molecularProfileIdDiscrete.result,
                        this.sampleIds
                    );
                }
                return {};
            },
        },
        {}
    );

    readonly sampleToDiscreteGenePanelId = remoteData<{
        [sampleId: string]: string;
    }>(
        {
            await: () => [this.sampleToDiscreteGenePanelData],
            invoke: async () => {
                return _.mapValues(
                    this.sampleToDiscreteGenePanelData.result,
                    genePanelData => genePanelData.genePanelId
                );
            },
        },
        {}
    );

    readonly genePanelIdToPanel = remoteData<{
        [genePanelId: string]: GenePanel;
    }>(
        {
            await: () => [
                this.sampleToMutationGenePanelData,
                this.sampleToDiscreteGenePanelData,
            ],
            invoke: async () => {
                const sampleGenePanelInfo = _.concat(
                    _.values(this.sampleToMutationGenePanelData.result),
                    _.values(this.sampleToDiscreteGenePanelData.result)
                );
                const panelIds = _(sampleGenePanelInfo)
                    .map(genePanelData => genePanelData.genePanelId)
                    .filter(genePanelId => !noGenePanelUsed(genePanelId))
                    .value();
                return fetchGenePanel(panelIds);
            },
        },
        {}
    );

    readonly genePanelIdToEntrezGeneIds = remoteData<{
        [genePanelId: string]: number[];
    }>(
        {
            await: () => [this.genePanelIdToPanel],
            invoke: async () => {
                return _(this.genePanelIdToPanel.result)
                    .mapValues(genePanel =>
                        _.map(
                            genePanel.genes,
                            genePanelToGene => genePanelToGene.entrezGeneId
                        )
                    )
                    .value();
            },
        },
        {}
    );

    @computed get mergedMutationData(): Mutation[][] {
        return mergeMutations(this.mutationData);
    }

    @computed get mutationHugoGeneSymbols(): string[] {
        var gene_symbols: string[] = [];
        this.mergedMutationData.forEach(function(value: Mutation[]) {
            gene_symbols.push(value[0].gene.hugoGeneSymbol);
        });

        this.mergedDiscreteCNADataFilteredByGene.forEach(function(
            value: DiscreteCopyNumberData[]
        ) {
            gene_symbols.push(value[0].gene.hugoGeneSymbol);
        });

        var unique_gene_symbols = [...new Set(gene_symbols)];

        return unique_gene_symbols;
    }

    @computed get mergedMutationDataIncludingUncalled(): Mutation[][] {
        return mergeMutationsIncludingUncalled(
            this.mutationData,
            this.uncalledMutationData
        );
    }

    @computed get mergedMutationDataFilteredByGene(): Mutation[][] {
        if (
            this.mutationTableGeneFilterOption === GeneFilterOption.ALL_SAMPLES
        ) {
            return filterMutationsByProfiledGene(
                this.mergedMutationData,
                this.sampleIds,
                this.sampleToMutationGenePanelId.result,
                this.genePanelIdToEntrezGeneIds.result
            );
        }
        return this.mergedMutationData;
    }

    @computed
    get mergedMutationDataIncludingUncalledFilteredByGene(): Mutation[][] {
        if (
            this.mutationTableGeneFilterOption === GeneFilterOption.ALL_SAMPLES
        ) {
            return filterMutationsByProfiledGene(
                this.mergedMutationDataIncludingUncalled,
                this.sampleIds,
                this.sampleToMutationGenePanelId.result,
                this.genePanelIdToEntrezGeneIds.result
            );
        }
        return this.mergedMutationDataIncludingUncalled;
    }

    @computed
    get mergedDiscreteCNADataFilteredByGene(): DiscreteCopyNumberData[][] {
        if (
            this.copyNumberTableGeneFilterOption ===
            GeneFilterOption.ALL_SAMPLES
        ) {
            return _.filter(
                this.mergedDiscreteCNAData,
                (mutations: DiscreteCopyNumberData[]) => {
                    const entrezGeneId = mutations[0].gene.entrezGeneId;
                    const geneProfiledInSamples = TumorColumnFormatter.getProfiledSamplesForGene(
                        entrezGeneId,
                        this.sampleIds,
                        this.sampleToMutationGenePanelId.result,
                        this.genePanelIdToEntrezGeneIds.result
                    );
                    return (
                        _(geneProfiledInSamples)
                            .values()
                            .filter((profiled: boolean) => profiled)
                            .value().length === this.sampleIds.length
                    );
                }
            );
        }
        return this.mergedDiscreteCNAData;
    }

    @computed get existsSomeMutationWithVAFData() {
        return _.some(
            this.mergedMutationDataIncludingUncalled,
            mutationList => {
                return _.some(mutationList, m => {
                    const vaf = getVariantAlleleFrequency(m);
                    return vaf != null && vaf > 0;
                });
            }
        );
    }

    readonly mutationTableShowGeneFilterMenu = remoteData({
        await: () => [
            this.samples,
            this.sampleToMutationGenePanelId,
            this.genePanelIdToEntrezGeneIds,
        ],
        invoke: () => {
            const entrezGeneIds: number[] = _.uniq(
                _.map(
                    this.mergedMutationDataIncludingUncalled,
                    mutations => mutations[0].entrezGeneId
                )
            );
            const sampleIds = this.samples.result!.map(s => s.sampleId);
            return Promise.resolve(
                sampleIds.length > 1 &&
                    checkNonProfiledGenesExist(
                        sampleIds,
                        entrezGeneIds,
                        this.sampleToMutationGenePanelId.result,
                        this.genePanelIdToEntrezGeneIds.result
                    )
            );
        },
    });

    readonly cnaTableShowGeneFilterMenu = remoteData({
        await: () => [
            this.samples,
            this.sampleToMutationGenePanelId,
            this.genePanelIdToEntrezGeneIds,
        ],
        invoke: () => {
            const entrezGeneIds: number[] = _.uniq(
                _.map(
                    this.mergedDiscreteCNAData,
                    alterations => alterations[0].entrezGeneId
                )
            );
            const sampleIds = this.samples.result!.map(s => s.sampleId);
            return Promise.resolve(
                sampleIds.length > 1 &&
                    checkNonProfiledGenesExist(
                        sampleIds,
                        entrezGeneIds,
                        this.sampleToMutationGenePanelId.result,
                        this.genePanelIdToEntrezGeneIds.result
                    )
            );
        },
    });

    @computed get uniqueSampleKeyToTumorType(): { [sampleId: string]: string } {
        return generateUniqueSampleKeyToTumorTypeMap(
            this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.samplesWithoutCancerTypeClinicalData
        );
    }

    @action('SetSampleId') setSampleId(newId: string) {
        if (newId) this._patientId = '';
        this._sampleId = newId;
    }

    @action('SetPatientId') setPatientId(newId: string) {
        if (newId) this._sampleId = '';
        this._patientId = newId;
    }

    @cached get mrnaExprRankCache() {
        return new MrnaExprRankCache(this.mrnaRankMolecularProfileId.result);
    }

    @cached get variantCountCache() {
        return new VariantCountCache(this.mutationMolecularProfileId.result);
    }

    @cached get discreteCNACache() {
        return new DiscreteCNACache(
            this.studyToMolecularProfileDiscrete.result
        );
    }

    @cached get oncoKbEvidenceCache() {
        return new OncoKbEvidenceCache();
    }

    @cached get genomeNexusCache() {
        return new GenomeNexusCache();
    }

    @cached get genomeNexusMyVariantInfoCache() {
        return new GenomeNexusMyVariantInfoCache();
    }

    @cached get genomeNexusMutationAssessorCache() {
        return new GenomeNexusMutationAssessorCache();
    }

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get copyNumberCountCache() {
        return new CopyNumberCountCache(this.molecularProfileIdDiscrete.result);
    }

    @cached get cancerTypeCache() {
        return new CancerTypeCache();
    }

    @cached get mutationCountCache() {
        return new MutationCountCache();
    }

    @cached get downloadDataFetcher() {
        return new MutationTableDownloadDataFetcher(this.mutationData);
    }

    @action setActiveTabId(id: string) {
        this.activeTabId = id;
    }

    @action clearErrors() {
        this.ajaxErrors = [];
    }

    readonly trialMatches = remoteData<ITrialMatch[]>(
        {
            invoke: () => {
                return fetchTrialMatchesUsingPOST({ mrn: this.patientId });
            },
        },
        []
    );

    readonly trialIds = remoteData<ITrialQuery>(
        {
            await: () => [this.trialMatches],
            invoke: async () => {
                let nctIds = new Set<string>(); // Trial unique id from clinicaltrials.gov
                let protocolNos = new Set<string>(); // Trials's MSK ID same as protocol_number or protocol_id
                _.forEach(
                    this.trialMatches.result,
                    (trialMatch: ITrialMatch) => {
                        if (_.isEmpty(trialMatch.protocolNo)) {
                            nctIds.add(trialMatch.nctId);
                        } else {
                            protocolNos.add(trialMatch.protocolNo);
                        }
                    }
                );
                return {
                    nct_id: [...nctIds],
                    protocol_no: [...protocolNos],
                };
            },
        },
        {
            nct_id: [],
            protocol_no: [],
        }
    );

    readonly trials = remoteData<ITrial[]>(
        {
            await: () => [this.trialIds],
            invoke: async () => {
                if (
                    this.trialIds.result.protocol_no.length > 0 ||
                    this.trialIds.result.nct_id.length > 0
                ) {
                    return fetchTrialsById(this.trialIds.result);
                }
                return [];
            },
        },
        []
    );

    readonly detailedTrialMatches = remoteData<IDetailedTrialMatch[]>(
        {
            await: () => [this.trials, this.trialMatches],
            invoke: async () => {
                if (this.trials.result && this.trialMatches.result) {
                    return groupTrialMatchesById(
                        this.trials.result,
                        this.trialMatches.result
                    );
                }
                return [];
            },
        },
        []
    );

    readonly getStudiesFromOncoKBSortedByCondition = remoteData<
        IOncoKBStudyDictionary
    >({
        await: () => [],
        invoke: async () => {
            var res: IOncoKBStudyDictionary = await getStudiesByCondtionsFromOncoKB();
            return res;
        },
    });

    readonly getStudiesFromClinicalTrialsGov = remoteData<StudyListEntry[]>(
        {
            await: () => [
                this.getStudiesFromOncoKBSortedByCondition,
                this.patientViewData,
            ],
            invoke: async () => {
                var study_list = new StudyList();
                var sortedList;
                var all_gene_symbols: string[] = this.mutationHugoGeneSymbols;
                var clinicalTrialQuery = this.clinicalTrialSerchParams;
                var search_symbols = clinicalTrialQuery.symbolsToSearch;
                var nec_search_symbols = clinicalTrialQuery.necSymbolsToSearch;
                var gene_symbols: string[] = [];
                var study_dictionary: IOncoKBStudyDictionary = await this
                    .getStudiesFromOncoKBSortedByCondition.result;
                var trials_for_condtion: string[] = [];

                gene_symbols = [];
                if (
                    search_symbols.length == 0 &&
                    nec_search_symbols.length == 0
                ) {
                    gene_symbols = [];
                } else {
                    gene_symbols = search_symbols.concat(nec_search_symbols);
                    gene_symbols = [...new Set(gene_symbols)];
                }

                for (const symbol of gene_symbols) {
                    var result: Study[] = await this.getAllStudiesForKeyword(
                        symbol,
                        nec_search_symbols
                    );
                    for (const std of result) {
                        study_list.addStudy(std, symbol);
                    }
                }

                var patientData = await this.patientViewData.result;
                var samples = patientData.samples;
                var oncotree_codes_in_samples: string[] = [];

                for (var i = 0; i < samples.length; i++) {
                    oncotree_codes_in_samples.push(
                        samples[i].clinicalData[6].value
                    );
                }

                var study_dictionary: IOncoKBStudyDictionary = await this
                    .getStudiesFromOncoKBSortedByCondition.result;
                trials_for_condtion = getAllStudyNctIdsByOncoTreeCodes(
                    study_dictionary,
                    oncotree_codes_in_samples
                );

                study_list.calculateScores(
                    trials_for_condtion,
                    clinicalTrialQuery.age,
                    clinicalTrialQuery.gender,
                    clinicalTrialQuery.patientLocation
                );

                console.log(study_list);

                var tmp: Map<
                    String,
                    StudyListEntry
                > = study_list.getStudyListEntires();
                var arr: StudyListEntry[] = Array.from(tmp.values());
                var sorted_arr: StudyListEntry[] = arr.sort(
                    (a, b) => b.getScore() - a.getScore()
                );

                console.log(sorted_arr);
                var res = '["';
                for (const a of sorted_arr) {
                    res += a.getStudy().ProtocolSection.IdentificationModule
                        .NCTId;
                    res += '","';
                }
                console.log(res);

                return sorted_arr;
            },
        },
        []
    );

    readonly clinicalTrialMatches = remoteData<IDetailedClinicalTrialMatch[]>(
        {
            await: () => [this.getStudiesFromClinicalTrialsGov],
            invoke: async () => {
                var result: IDetailedClinicalTrialMatch[] = [];
                for (const std of this.getStudiesFromClinicalTrialsGov.result) {
                    var loc: string[] = [];
                    var inv: string[] = [];

                    var locationModule: Location[] = [];
                    var interventionModule: Intervention[] = [];
                    var eligibilityCriteria: string = '';

                    try {
                        locationModule = std.getStudy().ProtocolSection
                            .ContactsLocationsModule.LocationList.Location;
                    } catch (e) {
                        //no location module in study
                        locationModule = [];
                    }

                    try {
                        interventionModule = std.getStudy().ProtocolSection
                            .ArmsInterventionsModule.InterventionList
                            .Intervention;
                    } catch (e) {
                        //no intervention module in study
                        interventionModule = [];
                    }

                    try {
                        eligibilityCriteria = std.getStudy().ProtocolSection
                            .EligibilityModule.EligibilityCriteria;
                    } catch (e) {
                        eligibilityCriteria = '';
                    }

                    for (let i = 0; i < locationModule.length; i++) {
                        let location: Location = locationModule[i];
                        loc.push(
                            location.LocationCity +
                                ': ' +
                                location.LocationFacility +
                                ': ' +
                                location.LocationStatus
                        );
                    }

                    for (let i = 0; i < interventionModule.length; i++) {
                        let intervention: Intervention = interventionModule[i];
                        inv.push(intervention.InterventionName);
                    }

                    var newTrial = {
                        found: std.getNumberFound(),
                        keywords: std.getKeywords().toString(),
                        conditions: std.getStudy().ProtocolSection
                            .ConditionsModule.ConditionList.Condition,
                        title: std.getStudy().ProtocolSection
                            .IdentificationModule.OfficialTitle,
                        nct: std.getStudy().ProtocolSection.IdentificationModule
                            .NCTId,
                        status: std.getStudy().ProtocolSection.StatusModule
                            .OverallStatus,
                        locations: loc,
                        interventions: inv,
                        condition_matching: false,
                        score: std.getScore(),
                        eligibility: eligibilityCriteria,
                        explanation: std.getExplanations(),
                    };
                    result.push(newTrial);
                }
                return result;
            },
        },
        []
    );

    private async getAllStudiesForKeyword(
        keyword: string,
        nec_search_symbols: string[]
    ): Promise<Study[]> {
        const STEPSIZE = 100;
        var all_studies: Study[] = [];
        var result: ClinicalTrialsGovStudies = await searchStudiesForKeywordAsString(
            keyword,
            nec_search_symbols,
            1,
            1,
            this.clinicalTrialSerchParams.clinicalTrialsCountires,
            this.clinicalTrialSerchParams.clinicalTrialsRecruitingStatus
        ); //find amount of available studies.
        var num_studies_found = result.FullStudiesResponse.NStudiesFound;
        var current_max = STEPSIZE; //ClinicalTrials.gov API Allows to oly fetch 100 studies at a time
        var current_min = 1;

        if (num_studies_found <= 0) {
            console.log('no studies found for keyword ' + keyword);
            return all_studies;
        }

        //get first batch of avialable studies
        result = await searchStudiesForKeywordAsString(
            keyword,
            nec_search_symbols,
            current_min,
            current_max,
            this.clinicalTrialSerchParams.clinicalTrialsCountires,
            this.clinicalTrialSerchParams.clinicalTrialsRecruitingStatus
        );

        result.FullStudiesResponse.FullStudies.forEach(function(value) {
            all_studies.push(value.Study);
        });

        //check if there are more studies to fetch
        while (current_max < num_studies_found) {
            current_min = current_max + 1;
            current_max = current_max + STEPSIZE;

            result = await searchStudiesForKeywordAsString(
                keyword,
                nec_search_symbols,
                current_min,
                current_max,
                this.clinicalTrialSerchParams.clinicalTrialsCountires,
                this.clinicalTrialSerchParams.clinicalTrialsRecruitingStatus
            );
            result.FullStudiesResponse.FullStudies.forEach(function(value) {
                all_studies.push(value.Study);
            });
        }

        return all_studies;
    }

    public setClinicalTrialSearchParams(
        countries: string[],
        status: RecruitingStatus[],
        symbols: string[],
        necSymbols: string[],
        gender: string,
        patientLocation: string,
        age: number
    ) {
        var cntr: string[] = [];

        if (countries.length == 0) {
            cntr = [];
        } else {
            cntr = countries;
        }

        this.isClinicalTrialsLoading = true;

        this.clinicalTrialSerchParams = new ClinicalTrialsSearchParams(
            cntr,
            status,
            symbols,
            necSymbols,
            gender,
            patientLocation,
            age
        );
    }
}
