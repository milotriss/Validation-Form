function Validator(formSelector, options = {}){

    // Hàm lấy đc DOM của thẻ cha, ông, cố, cụ cố, tổ...
    function getParent(element, selector){
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }


    let formRules = {}

    // Quy ước tạo rule:
    // 1. Nếu có lỗi thì return `error message`
    //2. Nếu không có lỗi thì return `undefined`
    let validateRules = {
        required: (value, message) => value ? undefined : message || 'Please enter this field!',
        email: (value, message) => {
            let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value) ? undefined : message || 'Please enter your email!'
        },

        min: (minLength) => {
            return (value, message) => value.length >= minLength ? undefined : message || `Enter at least ${minLength} characters`
        },
        max: (maxLength) => {
            return (value, message) => value.length <= maxLength ? undefined : message || `Enter at most ${maxLength} characters`
        },
    }

    // Lấy ra form element trong DOM theo `formSelector`
    let formElement = document.querySelector(formSelector)

    // Chỉ xử lý khi có element trong Dom
    if (formElement) {
        let inputs = formElement.querySelectorAll('[name][rule]')
        for (const input of inputs) {

            let rules = input.getAttribute('rules').split('|')
            for (const rule of rules) {
                let ruleInfo;
                let isRuleHasValue = rule.includes(':')

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':')
                    rule = ruleInfo[0]
                }

                let ruleFunction = validateRules[rule]
                if (isRuleHasValue) {
                    ruleFunction = ruleFunction(ruleInfo[1])
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunction)
                }else{
                    formRules[input.name] = [ruleFunction]
                }
            }

            // Lắng nghe sự kiện input để validate
            input.onblur = handleValidate
            input.oninput = handleClearError
        }

        // Hàm thực hiện Validate 
        function handleValidate(event){
            let rules = formRules[event.target.name]
            let errorMessage
            
            for (const rule of rules) {
              errorMessage = rule(event.target.name)
              if(errorMessage) break;
            }

            // Nếu có lỗi thì hiển thị errorMessage ra UI   
            if (errorMessage) {
                let formGroup = getParent(event.target, '.form-group')
                if (formGroup) {
                    formGroup.classList.add('invalid')
                    let formMessage = formGroup.querySelector('.form-message')
                    if (formMessage) {
                        formMessage.innerText = errorMessage
                    }
                }
            }
            return !errorMessage
        }

        // Hàm clear message lỗi
        function handleClearError(event){
            let formGroup = getParent(event.target, '.form-group')

            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid')

                let formMessage = formGroup.querySelector('.form-message')
                if (formMessage) {
                    formMessage.innerText = errorMessage
                }
            }
        }
    }

    // Xử lý hành vi submit form
    formElement.onsubmit = (event) => {
        event.preventDefault()

        let inputs = formElement.querySelectorAll('[name][rule]')
        let isValid = true
        for (const input of inputs) {
            if (!handleValidate({target:input})) {
                isValid = false
            }
        }

        // Khi không có lỗi thì submit form
        if (isValid) {
            if (typeof options.onSubmit === 'function') {
                let enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
                let formValues = Array.from(enableInputs).reduce((value,input) => {
                  
                  switch(input.type){
                    case 'checkbox':
                      if (input.matches(':checked')) {
                        value[input.name] = ''
                        return value
                      }
                      if (!Array.isArray(value[input.name])) {
                        value[input.name] = []
                      }
                      value[input.name].push(input.value)
                      break;
                    case 'radio':
                        value[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value
                      break;
                    case 'file':
                        value[input.name] = input.files
                      break;
                    default:
                      value[input.name] = input.value
                  }
                  return value
                }, {})

                // Gọi lại hàm onSubmit và trả về các giá trị của form
                options.onSubmit(formValues)
            }else {
                formElement.submit()
            }
        }
    }
}