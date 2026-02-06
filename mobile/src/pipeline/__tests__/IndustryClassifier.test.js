/**
 * IndustryClassifier Unit Tests
 * Tests for MSME sector classification of SMS messages
 */

const {
    classifyIndustry,
    getIndustryInfo,
    getAllIndustries,
    IndustrySector,
} = require('../IndustryClassifier');

describe('IndustryClassifier', () => {
    describe('classifyIndustry', () => {
        describe('Manufacturing sector', () => {
            test('detects manufacturing by merchant name', () => {
                const result = classifyIndustry('Payment to Tata Steel for raw materials Rs. 50,000');
                expect(result.sector).toBe('manufacturing');
                expect(result.confidence).toBeGreaterThan(0.8);
            });

            test('detects manufacturing by keywords', () => {
                const result = classifyIndustry('Purchase of CNC machining parts for factory floor');
                expect(result.sector).toBe('manufacturing');
                expect(result.matchType).toBe('keyword');
            });

            test('detects manufacturing by process keywords', () => {
                const result = classifyIndustry('Assembly line components for production unit');
                expect(result.sector).toBe('manufacturing');
            });
        });

        describe('Logistics sector', () => {
            test('detects logistics by merchant', () => {
                const result = classifyIndustry('Payment to Blue Dart for courier services Rs. 2,500');
                expect(result.sector).toBe('logistics');
                expect(result.confidence).toBeGreaterThan(0.8);
            });

            test('detects logistics by keywords', () => {
                const result = classifyIndustry('Fleet maintenance and diesel purchase for trucks');
                expect(result.sector).toBe('logistics');
            });
        });

        describe('Agriculture sector', () => {
            test('detects agriculture by merchant', () => {
                const result = classifyIndustry('Purchase from IFFCO fertilizer Rs. 15,000');
                expect(result.sector).toBe('agriculture');
            });

            test('detects agriculture by keywords', () => {
                const result = classifyIndustry('Tractor spare parts and irrigation pump repair');
                expect(result.sector).toBe('agriculture');
            });
        });

        describe('E-commerce sector', () => {
            test('detects e-commerce by merchant', () => {
                const result = classifyIndustry('Amazon Seller Central payout credited Rs. 45,000');
                expect(result.sector).toBe('e_commerce');
            });

            test('detects e-commerce by keywords', () => {
                const result = classifyIndustry('Shiprocket shipping label for order fulfillment');
                expect(result.sector).toBe('e_commerce');
            });
        });

        describe('Textiles sector', () => {
            test('detects textiles by merchant', () => {
                const result = classifyIndustry('Payment to Raymond for fabric order Rs. 1,20,000');
                expect(result.sector).toBe('textiles');
            });

            test('detects textiles by keywords', () => {
                const result = classifyIndustry('Cotton yarn dyeing and weaving charges');
                expect(result.sector).toBe('textiles');
            });
        });

        describe('Healthcare sector', () => {
            test('detects healthcare by merchant', () => {
                const result = classifyIndustry('Cipla pharma payment for medical supplies Rs. 80,000');
                expect(result.sector).toBe('healthcare');
            });

            test('detects healthcare by keywords', () => {
                const result = classifyIndustry('Hospital medical equipment sterilization service');
                expect(result.sector).toBe('healthcare');
            });
        });

        describe('Construction sector', () => {
            test('detects construction by merchant', () => {
                const result = classifyIndustry('UltraTech cement order payment Rs. 2,50,000');
                expect(result.sector).toBe('construction');
            });

            test('detects construction by keywords', () => {
                const result = classifyIndustry('Site excavation and concrete foundation work');
                expect(result.sector).toBe('construction');
            });
        });

        describe('Food Processing sector', () => {
            test('detects food processing by merchant', () => {
                const result = classifyIndustry('Purchase from Britannia for packaged goods Rs. 50,000');
                expect(result.sector).toBe('food_processing');
            });

            test('detects food processing by keywords', () => {
                const result = classifyIndustry('Cold storage facility and FSSAI compliance fees');
                expect(result.sector).toBe('food_processing');
            });
        });

        describe('Other/Unknown sector', () => {
            test('returns other for unrecognized messages', () => {
                const result = classifyIndustry('Random personal message with no industry context');
                expect(result.sector).toBe('other');
                expect(result.confidence).toBeLessThan(0.5);
            });

            test('handles empty message', () => {
                const result = classifyIndustry('');
                expect(result.sector).toBe('other');
                expect(result.reasonCodes).toContain('empty_message');
            });
        });
    });

    describe('getIndustryInfo', () => {
        test('returns correct info for manufacturing', () => {
            const info = getIndustryInfo('manufacturing');
            expect(info.label).toBe('Manufacturing');
            expect(info.icon).toBe('🏭');
            expect(info.color).toBeDefined();
        });

        test('returns correct info for logistics', () => {
            const info = getIndustryInfo('logistics');
            expect(info.label).toBe('Logistics');
            expect(info.icon).toBe('🚚');
        });

        test('returns default info for unknown sector', () => {
            const info = getIndustryInfo('unknown_sector');
            expect(info.label).toBe('Other');
            expect(info.icon).toBe('📄');
        });
    });

    describe('getAllIndustries', () => {
        test('returns all 20 industry sectors', () => {
            const industries = getAllIndustries();
            expect(industries.length).toBe(20);
        });

        test('each industry has required properties', () => {
            const industries = getAllIndustries();
            industries.forEach(industry => {
                expect(industry.key).toBeDefined();
                expect(industry.label).toBeDefined();
                expect(industry.icon).toBeDefined();
                expect(industry.color).toBeDefined();
            });
        });
    });

    describe('IndustrySector constants', () => {
        test('has all expected sector keys', () => {
            expect(IndustrySector.MANUFACTURING).toBe('manufacturing');
            expect(IndustrySector.LOGISTICS).toBe('logistics');
            expect(IndustrySector.AGRICULTURE).toBe('agriculture');
            expect(IndustrySector.E_COMMERCE).toBe('e_commerce');
            expect(IndustrySector.TEXTILES).toBe('textiles');
            expect(IndustrySector.HEALTHCARE).toBe('healthcare');
            expect(IndustrySector.CONSTRUCTION).toBe('construction');
            expect(IndustrySector.FOOD_PROCESSING).toBe('food_processing');
            expect(IndustrySector.OTHER).toBe('other');
        });
    });

    describe('Real-world SMS samples', () => {
        test('classifies steel supplier payment', () => {
            const result = classifyIndustry(
                'HDFC Bank: Rs.1,50,000 debited from a/c XX1234 on 15-Jan for RTGS to JSW Steel. Avl Bal Rs.8,50,000'
            );
            expect(result.sector).toBe('manufacturing');
        });

        test('classifies logistics freight payment', () => {
            const result = classifyIndustry(
                'Payment of Rs.45,000 to TCI Express for freight and warehousing services. Ref: LR123456'
            );
            expect(result.sector).toBe('logistics');
        });

        test('classifies agricultural input purchase', () => {
            const result = classifyIndustry(
                'Rs.25,000 paid to IFFCO for fertilizer and pesticides. UPI Ref: 987654321'
            );
            expect(result.sector).toBe('agriculture');
        });

        test('classifies e-commerce seller payout', () => {
            const result = classifyIndustry(
                'Meesho seller payout of Rs.38,500 credited to your account for marketplace sales'
            );
            expect(result.sector).toBe('e_commerce');
        });

        test('classifies construction material purchase', () => {
            const result = classifyIndustry(
                'ACC Cement order confirmed. Rs.1,80,000 for 200 bags cement. Delivery to construction site on 20-Jan'
            );
            expect(result.sector).toBe('construction');
        });
    });
});
