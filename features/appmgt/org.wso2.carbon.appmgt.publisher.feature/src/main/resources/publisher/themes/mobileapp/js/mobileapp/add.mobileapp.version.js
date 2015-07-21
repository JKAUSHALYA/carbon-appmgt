/*
 * Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var UploadStatus = Object.freeze({
    EMPTY: 0,
    SELECTED: 1,
    UPLOADING: 2,
    FINISHED_SUCCESS: 3,
    FINISHED_FAIL: 4
});
var fileUploadStatus = UploadStatus.EMPTY;
var fileUploadData = null;
var NUMBER_OF_SCREENSHOTS = 3;
var CSS_CLASS_VALIDATION_ERROR = 'validation-error';
var DATA_ATTRIBUTE_VALIDATION_MESSAGE = 'validation-message';

function showModal(options) {
    if (!options) {
        return;
    }

    $('#message-modal .modal-title').text(options.title || 'Message');
    $('#message-modal .modal-body').text(options.body);
    $('#message-modal-button').text(options.button || 'Close');
    var modalHeader = $('#message-modal .modal-header');
    var currentCssClass = modalHeader.attr('data-type');
    modalHeader.removeClass('alert-' + currentCssClass);
    modalHeader.addClass('alert-' + options.type);
    modalHeader.attr('data-type', options.type);

    if (options.callbacks) {
        var modal = $('#message-modal');
        var callbacks = options.callbacks;
        if (callbacks.show) {
            modal.one('shown.bs.modal', callbacks.show)
        }
        if (callbacks.hide) {
            modal.one('hidden.bs.modal', callbacks.hide)
        }
    }
    $('#message-modal').modal('show');
}

function updateFileUploadProgress(options) {
    switch (fileUploadStatus) {
        case UploadStatus.UPLOADING:
            $("#file-upload-progress").show()
            var p = options.progress;
            $('#file-upload-progressbar').css('width', p + '%').attr('aria-valuenow', p);
            if (p == 100) {
                $('#file-upload-progressbar-wrapper').addClass('progress-striped').addClass('active');
            }
            $("#file-upload-success-msg").hide();
            break;
        case UploadStatus.FINISHED_SUCCESS:
            $("#file-upload-progress").hide();
            $('#file-upload-progressbar').css('width', '0%').attr('aria-valuenow', 0);
            $('#file-upload-progressbar-wrapper').removeClass('progress-striped').removeClass('active');
            $("#file-upload-success-msg").show();
            break;
        case UploadStatus.FINISHED_FAIL:
            $("#file-upload-progress").hide();
            $('#file-upload-progressbar').css('width', '0%').attr('aria-valuenow', 0);
            $('#file-upload-progressbar-wrapper').removeClass('progress-striped').removeClass('active');
            $("#file-upload-success-msg").hide();
            break;
        default:
            $("#file-upload-progress").hide();
            $("#file-upload-success-msg").hide();
    }
}

function gotoWizardStep(step) {
    if (step == 1) {

        if (fileUploadStatus == UploadStatus.UPLOADING) {
            return;
        }
        $("#wizard-step-1").show();
        $('#wizard-step-1-link').addClass("active");
        $('#wizard-step-2').hide();
        $('#wizard-step-2-link').removeClass("active");

    } else if (step == 2) {

        if (fileUploadStatus == UploadStatus.SELECTED) {
            fileUploadData.submit();
            fileUploadData = null;
        }

        $("#wizard-step-2").show();
        $('#wizard-step-2-link').addClass("active");
        $('#wizard-step-1').hide();
        $('#wizard-step-1-link').removeClass("active");

        var wizardStep2Form = $('#wizard-step-2-form');
        var webappUrlInput = $('#txtWebappUrl');
        if (webappUrlInput.length == 1) {
            wizardStep2Form.append("<input type='hidden' id='" + webappUrlInput.attr('id')
                                   + "' name='-2" + webappUrlInput.attr('name') + "' value='"
                                   + webappUrlInput.val() + "' />");
        }
        var packageNameInput = $('#txtPackageName');
        if (packageNameInput.length == 1) {
            wizardStep2Form.append("<input type='hidden' id='" + packageNameInput.attr('id')
                                   + "-2' name='" + packageNameInput.attr('name') + "' value='"
                                   + packageNameInput.val() + "' />");
        }
        var appIdentifierInput = $('#txtAppIdentifier');
        if (appIdentifierInput.length == 1) {
            wizardStep2Form.append("<input type='hidden' id='" + appIdentifierInput.attr('id')
                                   + "-2' name='" + appIdentifierInput.attr('name') + "' value='"
                                   + appIdentifierInput.val() + "' />");
        }
    }
}

function validateAjaxFileUpload() {
    var platform = $('#txtPlatform').val();
    var storeType = $('#txtStoreType').val();
    // if this is an enterprise android/ios mobile app
    if ((platform == 'android' || platform == 'ios') && (storeType == 'enterprise')) {
        // then user should upload a file
        if ((fileUploadStatus == UploadStatus.EMPTY) ||
            (fileUploadStatus == UploadStatus.FINISHED_FAIL)) {
            return {
                valid: false,
                message: "Please select a file to upload before proceed into next step."
            };
        }
    }
    return {valid: true, message: ""};
}

function isValidURL(url) {
    var regex = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regex.test(url);
}

function validateWizardStep1Form() {

    var platform = $('#txtPlatform').val();
    if (platform == 'webapp') {
        // this is a mobile web app
        var webappUrl = $('#txtWebappUrl').val();
        if (!isValidURL(webappUrl)) {
            return {
                valid: false,
                message: "Please enter a valid URL before proceed into next step."
            };
        }
    } else if ((platform == 'android') || (platform == 'ios')) {
        // this is a android/ios mobile app
        var storeType = $('#txtStoreType').val();
        if (storeType == 'enterprise') {
            // user should upload a file
            if ((fileUploadStatus == UploadStatus.EMPTY) ||
                (fileUploadStatus == UploadStatus.FINISHED_FAIL)) {
                return {
                    valid: false,
                    message: 'Please select a file to upload before proceed into next step.'
                };
            }
        } else if (storeType == 'public') {
            // user should enter a package name
            if (!$('#txtPackageName').val()) {
                return {
                    valid: false,
                    message: 'Please enter a package name before proceed into next step.'
                };
            }
        } else {
            return {
                valid: false,
                message: "Unknown store type '" + storeType
                         + "'. Please select a valid store type."
            };
        }
    } else {
        return {
            valid: false,
            message: "Unknown platform '" + platform + "'. Please select a valid platform."
        };
    }

    return {valid: true};
}

function validateWizardStep2Form() {

    var displayName = $('#txtDisplayName').val();
    if (!displayName) {
        return {
            valid: false,
            message: 'Display name cannot be empty. Please enter a valid display name for this app.'
        };
    }

    var description = $('#txtDescription').val();
    if (!description) {
        return {
            valid: false,
            message: 'Description cannot be empty. Please enter a valid description for this app.'
        };
    }

    var banner = $('#imgBanner').val();
    if (!banner && !$('#imgBannerPreviewWrapper img').attr('src')) {
        return {
            valid: false,
            message: 'Banner image cannot be empty. Please select a banner image for this app.'
        };
    }

    var emptyScreenshotsCount = 0;
    for (var i = 0; i < NUMBER_OF_SCREENSHOTS; i++) {
        var screenshot = $('#imgScreenshot' + i).val();
        if (!screenshot && !$('#imgScreenshotPreviewWrapper-' + i + ' img').attr('src')) {
            emptyScreenshotsCount++;
        }
    }
    if (emptyScreenshotsCount == 3) {
        return {
            valid: false,
            message: 'Screenshots cannot be empty. Please select at least one screenshot image for this app.'
        };
    }

    var icon = $('#imgThumbnail').val();
    if (!icon && !$('#imgThumbnailPreviewWrapper img').attr('src')) {
        return {
            valid: false,
            message: 'Icon image cannot be empty. Please select an icon image for this app.'
        };
    }

    return {valid: true};
}

$(document).ready(function () {

    $('#wizard-step-1-link').click(function (e) {
        gotoWizardStep(1);
    });

    $('#wizard-step-2-link').click(function (e) {
        $("#btn-next").trigger("click");
    });

    $('#btn-next').click(function (e) {
        var inputElements = $('#wizard-step-1-form select:visible, #wizard-step-1-form input:text:visible');
        var data = {partial: true};
        for (var i = 0; i < inputElements.length; i++) {
            var inputElement = $(inputElements[i]);
            if (inputElement.hasClass(CSS_CLASS_VALIDATION_ERROR)) {
                // user have not yet updated a validation failed input
                var modalOptions = {
                    title: "Validation Error",
                    body: inputElement.data(DATA_ATTRIBUTE_VALIDATION_MESSAGE),
                    type: 'danger'
                };
                showModal(modalOptions);
                return;
            }
            data[inputElement.attr('name')] = inputElement.val();
        }

        var validationResult = validateAjaxFileUpload();
        if (!validationResult.valid) {
            var modalOptions = {
                title: "Validation Error",
                body: validationResult.message,
                type: 'danger'
            };
            showModal(modalOptions);
            return;
        }

        jQuery.ajax({
            url: '/publisher/api/validate/mobileapp/form/name/copyapp',
            type: 'GET',
            data: data,
            success: function (data, text) {
                gotoWizardStep(2);
            },
            error: function (request, status, error) {
                if (request.status == 422) {
                    // validation error
                    var response = jQuery.parseJSON(request.responseText);
                    var modalMessage = "";
                    for (var key in response.messages) {
                        var relevantInput = $('input[name=' + key + ']');
                        relevantInput.addClass(CSS_CLASS_VALIDATION_ERROR);
                        relevantInput.data(DATA_ATTRIBUTE_VALIDATION_MESSAGE,
                                           response.messages[key]);
                        modalMessage = modalMessage + "<br/>" + response.messages[key];
                    }
                    var modalOptions = {
                        title: response.status,
                        body: modalMessage,
                        type: 'danger'
                    };
                    showModal(modalOptions);
                } else {
                    console.log(request);
                }
            }
        });
    });

    $('select:enabled, input:text:enabled, textarea:enabled').blur(function (e) {
        var relevantInput = $(e.target);
        var platform = $('#txtPlatform');
        var storeType = $('#txtStoreType');

        var url = '/publisher/api/validate/mobileapp/field/' + relevantInput.attr('name');
        var data = {};
        data[relevantInput.attr('name')] = relevantInput.val();
        data[platform.attr('name')] = platform.val();
        data[storeType.attr('name')] = storeType.val();

        jQuery.ajax({
            url: url,
            type: 'GET',
            data: data,
            success: function (data, text) {
                relevantInput.removeClass(CSS_CLASS_VALIDATION_ERROR);
                relevantInput.removeData(DATA_ATTRIBUTE_VALIDATION_MESSAGE);
            },
            error: function (request, status, error) {
                if (request.status == 422) {
                    // validation error
                    relevantInput.addClass(CSS_CLASS_VALIDATION_ERROR);
                    var response = jQuery.parseJSON(request.responseText);
                    relevantInput.data(DATA_ATTRIBUTE_VALIDATION_MESSAGE, response.message);
                } else {
                    console.log(request);
                }
            }
        });
    });

    $('#fileAppUpload').fileuploadFile({
        dataType: 'json',
        autoUpload: false,
        singleFileUploads: true,
        maxNumberOfFiles: 1,
        multipart: true,
        add: function (e, data) {
            data.platform = $('#txtPlatform').val();
            fileUploadData = data;
            fileUploadStatus = UploadStatus.SELECTED;
        },
        progress: function (e, data) {
            fileUploadStatus = UploadStatus.UPLOADING;
            var options = {
                progress: parseInt(data.loaded / data.total * 100)
            };
            updateFileUploadProgress(options);
        },
        done: function (e, data) {
            var response = data._response.result;
            if (response.ok == false) {
                fileUploadStatus = UploadStatus.FINISHED_FAIL;
                var modalOptions = {
                    title: response.message,
                    body: response.report.name,
                    type: 'danger',
                    callbacks: {
                        hide: function (e) {
                            $('#wizard-step-1-form').trigger('reset');
                            $("#wizard-step-1-link").trigger("click");
                        }
                    }
                };
                showModal(modalOptions);
            } else {
                fileUploadStatus = UploadStatus.FINISHED_SUCCESS;
                $('#txtVersion').val(response.version).attr('disabled', 'disabled');
                var wizardStep2Form = $('#wizard-step-2-form');
                wizardStep2Form.append("<input type='hidden' id='appPackageName' "
                                       + "name='overview_packagename' value='" + response.package
                                       + "' />");
                wizardStep2Form.append("<input type='hidden' id='appVersion' "
                                       + "name='overview_version' value='" + response.version
                                       + "' />");
                wizardStep2Form.append("<input type='hidden' id='appFile' "
                                       + "name='overview_file' value='" + response.path + "' />");
            }
            updateFileUploadProgress();
        }

    });

    jQuery("#wizard-step-2-form").submit(function (e) {
        if (fileUploadStatus == UploadStatus.UPLOADING) {
            return;
        }
        var inputElements = $('#wizard-step-1-form select:visible, #wizard-step-1-form input:text:visible');
        for (var i = 0; i < inputElements.length; i++) {
            var inputElement = $(inputElements[i]);
            if (inputElement.hasClass(CSS_CLASS_VALIDATION_ERROR)) {
                // user have not yet updated a validation failed input
                var modalOptions = {
                    title: "Validation Error",
                    body: inputElement.data(DATA_ATTRIBUTE_VALIDATION_MESSAGE),
                    type: 'danger'
                };
                showModal(modalOptions);
                e.stopPropagation();
                e.preventDefault();
                return;
            }
        }
    });

    // bind a callback function
    $('#wizard-step-2-form').ajaxForm(function (data) {
        var response = JSON.parse(data._response.result);
        if (response.ok == false) {
            var modalOptions = {
                title: response.message,
                body: response.report.name,
                type: 'danger'
            };
            showModal(modalOptions);
        } else {
            window.location.replace("/publisher/assets/mobileapp/");
        }
    });

});

$(document).ajaxComplete(function (event, xhr, settings) {
    if (xhr.status == 401) {
        location.reload();
    }
});
