export const PRODUCT_TYPES = {
    FUND: 'FUND',
    ELS: 'ELS',
    OTC_BOND: 'OTC_BOND',
    ELB: 'ELB',
    GENERAL: 'GENERAL'
};

export const TERMS_POPUP_COMPONENTS = {
    PRODUCT_DESCRIPTION: 'PRODUCT_DESCRIPTION',
    SIMPLE_DESCRIPTION: 'SIMPLE_DESCRIPTION',
    REQUIRED_CHECK: 'REQUIRED_CHECK',
    RISK_DISCLOSURE: 'RISK_DISCLOSURE',
    SUBSCRIBER_CHECK: 'SUBSCRIBER_CHECK',
    INVESTMENT_NOTICE: 'INVESTMENT_NOTICE'
};

export const TERMS_CONFIG = {
    [PRODUCT_TYPES.FUND]: [
        {
            id: 'fund_product_description',
            label: '상품설명서',
            order: 1,
            popupComponent: TERMS_POPUP_COMPONENTS.PRODUCT_DESCRIPTION,
            content: '펀드 상품설명서 상세 내용입니다. 투자 위험 및 수수료 등을 반드시 확인하시기 바랍니다.',
            requirePopup: true
        },
        {
            id: 'fund_simple_description',
            label: '간이설명서',
            order: 2,
            popupComponent: TERMS_POPUP_COMPONENTS.SIMPLE_DESCRIPTION,
            content: '펀드 간이설명서 요약 내용입니다.',
            requirePopup: true
        },
        {
            id: 'fund_required_check',
            label: '필수확인사항',
            order: 3,
            popupComponent: TERMS_POPUP_COMPONENTS.REQUIRED_CHECK,
            content: '펀드 구매 시 필수적으로 확인해야 할 사항들입니다.',
            requirePopup: true
        }
    ],
    [PRODUCT_TYPES.ELS]: [
        {
            id: 'els_product_description',
            label: '상품설명서',
            order: 1,
            popupComponent: TERMS_POPUP_COMPONENTS.PRODUCT_DESCRIPTION,
            content: 'ELS 상품의 구조와 수익 조건을 설명합니다.',
            requirePopup: true
        },
        {
            id: 'els_risk_disclosure',
            label: '위험고지문',
            order: 2,
            popupComponent: TERMS_POPUP_COMPONENTS.RISK_DISCLOSURE,
            content: 'ELS 투자에 따른 원금 손실 위험 등을 고지합니다.',
            requirePopup: true
        },
        {
            id: 'els_subscriber_check',
            label: '청약자 점검사항',
            order: 3,
            popupComponent: TERMS_POPUP_COMPONENTS.SUBSCRIBER_CHECK,
            content: '청약 전 자가 점검이 필요한 항목들입니다.',
            requirePopup: true
        }
    ],
    [PRODUCT_TYPES.GENERAL]: [
        {
            id: 'general_privacy_policy',
            label: '개인정보 수집 및 이용 동의',
            order: 1,
            requirePopup: false
        },
        {
            id: 'general_terms_of_service',
            label: '서비스 이용약관 동의',
            order: 2,
            requirePopup: false
        },
        {
            id: 'general_marketing_consent',
            label: '마케팅 정보 수신 동의 (선택)',
            order: 3,
            requirePopup: false
        }
    ]
};
