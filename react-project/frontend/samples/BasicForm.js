import html from '../lib/htmEngine.js';
import CustomInput from '../components/CustomInput.js';

const { useState } = window.React;

export default function BasicForm() {
    const [formData, setFormData] = useState({
        userId: '',
        password: '',
        age: ''
    });

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!formData.userId) newErrors.userId = '아이디는 필수입니다.';
        else if (formData.userId.length < 5) newErrors.userId = '아이디는 5글자 이상이어야 합니다.';
        
        if (!formData.password) newErrors.password = '비밀번호는 필수입니다.';
        
        if (!formData.age) newErrors.age = '나이는 필수입니다.';
        else if (isNaN(formData.age) || Number(formData.age) < 18) newErrors.age = '나이는 18 이상이어야 합니다.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (validate()) {
            alert('폼 유효성 검사 통과 및 제출: \n' + JSON.stringify(formData, null, 2));
        } else {
            alert('입력값을 확인해주세요.');
        }
    };

    const resetForm = () => {
        setFormData({ userId: '', password: '', age: '' });
        setErrors({});
    };

    return html`
        <div className="page-wrap" style=${{ maxWidth: '600px', margin: '0' }}>
            <div className="header" style=${{ marginBottom: '24px' }}>
                <h2>React Basic Form</h2>
                <div className="header-tools">
                    <button className="btn btn-secondary" onClick=${resetForm}>초기화</button>
                    <button className="btn btn-primary" onClick=${submitForm}>제출</button>
                </div>
            </div>

            <form className="card" onSubmit=${submitForm}>
                <div className="card-content">
                    <div className="form-group row">
                        <label className="form-label col-4">아이디</label>
                        <div className="col-8">
                            <${CustomInput}
                                name="userId"
                                value=${formData.userId}
                                onChange=${handleChange}
                                placeholder="아이디를 입력하세요"
                                error=${errors.userId}
                            />
                        </div>
                    </div>
                </div>
                <div className="card-content">
                    <div className="form-group row">
                        <label className="form-label col-4">비밀번호</label>
                        <div className="col-8">
                            <${CustomInput}
                                name="password"
                                type="password"
                                value=${formData.password}
                                onChange=${handleChange}
                                placeholder="비밀번호 입력"
                                error=${errors.password}
                            />
                        </div>
                    </div>
                </div>
                <div className="card-content">
                    <div className="form-group row align-items-center">
                        <label className="form-label col-4 mb-0">나이</label>
                        <div className="col-8">
                            <${CustomInput}
                                name="age"
                                value=${formData.age}
                                onChange=${handleChange}
                                placeholder="18세 이상"
                                isPrice=${true}
                                error=${errors.age}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    `;
}
